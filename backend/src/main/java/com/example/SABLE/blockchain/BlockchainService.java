package com.example.sable.blockchain;

import com.example.sable.dto.GanacheBlockDto;
import com.example.sable.dto.GanacheTxDto;
import com.example.sable.dto.BlockchainVerificationDto;
import com.example.sable.dto.TransactionIntegrityFindingDto;
import com.example.sable.integrity.TransactionIntegritySnapshot;
import com.example.sable.model.Transaction;
import com.example.sable.service.TransactionService;
import org.springframework.stereotype.Service;
import org.web3j.crypto.Credentials;
import org.web3j.crypto.WalletUtils;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.DefaultBlockParameter;
import org.web3j.protocol.http.HttpService;
import org.web3j.tx.Transfer;
import org.web3j.utils.Convert;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class BlockchainService {
    private static final String SENDER_PRIVATE_KEY =
            "0xe0396dd66930d63f462627faa75345913890d5476f4441b2bfb639a8a838f51f";

    private final Web3j web3j;
    private final TransactionService transactionService;

    public BlockchainService(TransactionService transactionService) {
        this.web3j = Web3j.build(new HttpService("http://127.0.0.1:7545"));
        this.transactionService = transactionService;
    }

    public String sendTransaction(String transactionId) throws Exception {
        Transaction tx = transactionService.getTransactionByTransactionId(transactionId);
        Credentials credentials = Credentials.create(SENDER_PRIVATE_KEY);

        String toAddress = tx.getReceiver();
        if (!WalletUtils.isValidAddress(toAddress)) {
            throw new IllegalArgumentException("Invalid Ethereum address in receiver: " + toAddress);
        }
        BigDecimal amount = BigDecimal.valueOf(tx.getAmount());

        var receipt = Transfer.sendFunds(
                web3j,
                credentials,
                toAddress,
                amount,
                Convert.Unit.ETHER
        ).send();

        tx.setOnChain(true);
        tx.setBlockchainTxHash(receipt.getTransactionHash());
        transactionService.save(tx);
        return receipt.getTransactionHash();
    }

    public void syncAllTransactionsToBlockchain() throws Exception {
        List<Transaction> transactions = transactionService.getUnsyncedTransactions();
        Credentials credentials = Credentials.create(SENDER_PRIVATE_KEY);
        for (Transaction tx : transactions) {
            try {
                String toAddress = tx.getReceiver();
                BigDecimal amount = BigDecimal.valueOf(tx.getAmount());

                if (!WalletUtils.isValidAddress(toAddress)) {
                    // Skip invalid records but keep syncing others.
                    continue;
                }

                var receipt = Transfer.sendFunds(
                        web3j,
                        credentials,
                        toAddress,
                        amount,
                        Convert.Unit.ETHER
                ).send();

                tx.setOnChain(true);
                tx.setBlockchainTxHash(receipt.getTransactionHash());
                transactionService.save(tx);
            } catch (Exception ignored) {
                // Keep syncing remaining pending transactions even if one fails.
            }
        }
    }

    public List<GanacheBlockDto> getRecentBlocks(int limit) throws Exception {
        int safeLimit = Math.max(1, Math.min(limit, 200));

        BigInteger latest = web3j.ethBlockNumber().send().getBlockNumber();
        List<GanacheBlockDto> blocks = new ArrayList<>();

        for (int i = 0; i < safeLimit; i++) {
            BigInteger blockNumber = latest.subtract(BigInteger.valueOf(i));
            if (blockNumber.signum() < 0) break;

            var resp = web3j.ethGetBlockByNumber(DefaultBlockParameter.valueOf(blockNumber), true).send();
            var block = resp.getBlock();
            if (block == null) continue;

            GanacheBlockDto dto = new GanacheBlockDto();
            dto.setBlockNumber(block.getNumber() != null ? block.getNumber().longValue() : blockNumber.longValue());
            dto.setBlockHash(block.getHash());
            dto.setPreviousBlockHash(block.getParentHash());
            dto.setTimestampMs(block.getTimestamp() != null ? block.getTimestamp().longValue() * 1000L : null);

            List<GanacheTxDto> txs = new ArrayList<>();
            for (var txResult : block.getTransactions()) {
                Object raw = txResult.get();
                if (!(raw instanceof org.web3j.protocol.core.methods.response.Transaction txObj)) continue;

                GanacheTxDto txDto = new GanacheTxDto();
                txDto.setTxHash(txObj.getHash());
                txDto.setSenderAddress(txObj.getFrom());
                txDto.setReceiverAddress(txObj.getTo());

                BigInteger valueWei = txObj.getValue();
                if (valueWei != null) {
                    txDto.setAmountWei(valueWei.toString());
                    txDto.setAmountEth(Convert.fromWei(new BigDecimal(valueWei), Convert.Unit.ETHER).toPlainString());
                }

                txs.add(txDto);
            }
            dto.setTransactions(txs);

            blocks.add(dto);
        }

        return blocks;
    }

    public BlockchainVerificationDto verifyBlockchainAndDatabase(int blockLimit) throws Exception {
        BlockchainVerificationDto result = new BlockchainVerificationDto();

        // 1) Verify chain linkage for the returned segment of chain.
        List<GanacheBlockDto> blocks = getRecentBlocks(blockLimit);
        result.setBlocks(blocks);
        result.setBlocksChecked(blocks.size());

        boolean linkageOk = true;
        // blocks are returned newest -> oldest. For i=0 (newest) parent should equal blocks[i+1].blockHash
        for (int i = 0; i + 1 < blocks.size(); i++) {
            GanacheBlockDto newer = blocks.get(i);
            GanacheBlockDto older = blocks.get(i + 1);
            String parent = newer.getPreviousBlockHash();
            String olderHash = older.getBlockHash();
            if (parent != null && olderHash != null && !parent.equalsIgnoreCase(olderHash)) {
                linkageOk = false;
                result.getWarnings().add("Blockchain linkage mismatch between block " + newer.getBlockNumber() + " and " + older.getBlockNumber());
                break;
            }
        }
        result.setChainLinkageValid(linkageOk);

        // 2) Verify each DB transaction against (a) stored integrity snapshot and (b) on-chain tx data (when available).
        List<Transaction> all = transactionService.getAllTransactions();
        List<TransactionIntegrityFindingDto> findings = new ArrayList<>();
        boolean tamperingDetected = !linkageOk;

        for (Transaction tx : all) {
            TransactionIntegrityFindingDto f = new TransactionIntegrityFindingDto();
            f.setDbId(tx.getId());
            f.setTransactionId(tx.getTransactionId());
            f.setOnChain(tx.isOnChain());
            f.setBlockchainTxHash(tx.getBlockchainTxHash());

            // 2a) DB tamper detection using snapshot hashes (if present).
            if (tx.getIntegrityRecordHash() == null ||
                    tx.getIntegrityTransactionIdHash() == null ||
                    tx.getIntegritySenderHash() == null ||
                    tx.getIntegrityReceiverHash() == null ||
                    tx.getIntegrityAmountHash() == null ||
                    tx.getIntegrityTimestampHash() == null) {
                f.setUnverifiable(true);
                f.getIssues().add("UNVERIFIABLE_NO_INTEGRITY_SNAPSHOT");
            } else {
                var snap = TransactionIntegritySnapshot.compute(tx);
                Set<String> tamperedFields = new HashSet<>();
                if (!tx.getIntegrityTransactionIdHash().equalsIgnoreCase(snap.transactionIdHash())) tamperedFields.add("transactionId");
                if (!tx.getIntegritySenderHash().equalsIgnoreCase(snap.senderHash())) tamperedFields.add("sender");
                if (!tx.getIntegrityReceiverHash().equalsIgnoreCase(snap.receiverHash())) tamperedFields.add("receiver");
                if (!tx.getIntegrityAmountHash().equalsIgnoreCase(snap.amountHash())) tamperedFields.add("amount");
                if (!tx.getIntegrityTimestampHash().equalsIgnoreCase(snap.timestampHash())) tamperedFields.add("timestamp");
                if (!tx.getIntegrityRecordHash().equalsIgnoreCase(snap.recordHash())) tamperedFields.add("recordHash");

                // Only core business fields should drive tampering detection.
                // recordHash/timestamp mismatches can happen due to legacy format/time precision drift.
                Set<String> businessFieldMismatches = new HashSet<>();
                if (tamperedFields.contains("transactionId")) businessFieldMismatches.add("transactionId");
                if (tamperedFields.contains("sender")) businessFieldMismatches.add("sender");
                if (tamperedFields.contains("receiver")) businessFieldMismatches.add("receiver");
                if (tamperedFields.contains("amount")) businessFieldMismatches.add("amount");

                if (!businessFieldMismatches.isEmpty()) {
                    f.setTampered(true);
                    f.getIssues().add("DB_TAMPERING_DETECTED");
                    f.getTamperedFields().addAll(businessFieldMismatches);
                } else if (!tamperedFields.isEmpty()) {
                    // Ignore recordHash/timestamp-only mismatch as non-tampering legacy drift.
                    f.getIssues().add("LEGACY_HASH_OR_TIMESTAMP_MISMATCH");
                    result.getWarnings().add("Legacy hash/timestamp mismatch for transactionId " + tx.getTransactionId());
                }
            }

            // 2b) Cross-check DB receiver/amount vs on-chain tx (when we have a hash).
            if (tx.isOnChain() && tx.getBlockchainTxHash() != null && !tx.getBlockchainTxHash().isBlank()) {
                var resp = web3j.ethGetTransactionByHash(tx.getBlockchainTxHash()).send();
                var onChainTx = resp.getTransaction().orElse(null);
                if (onChainTx == null) {
                    f.setTampered(true);
                    f.getIssues().add("ONCHAIN_TX_MISSING");
                } else {
                    String onChainTo = onChainTx.getTo();
                    if (onChainTo != null && tx.getReceiver() != null &&
                            !onChainTo.equalsIgnoreCase(tx.getReceiver())) {
                        f.setTampered(true);
                        f.getIssues().add("RECEIVER_MISMATCH_ONCHAIN_VS_DB");
                        if (!f.getTamperedFields().contains("receiver")) f.getTamperedFields().add("receiver");
                    }

                    BigInteger onChainWei = onChainTx.getValue();
                    if (onChainWei != null && tx.getAmount() != null) {
                        BigInteger dbWei;
                        try {
                            dbWei = Convert.toWei(BigDecimal.valueOf(tx.getAmount()), Convert.Unit.ETHER).toBigIntegerExact();
                        } catch (ArithmeticException ex) {
                            // If the amount has too many decimals for wei exactness, compare using BigDecimal.
                            BigDecimal dbWeiBd = Convert.toWei(BigDecimal.valueOf(tx.getAmount()), Convert.Unit.ETHER);
                            BigDecimal onChainWeiBd = new BigDecimal(onChainWei);
                            if (dbWeiBd.compareTo(onChainWeiBd) != 0) {
                                f.setTampered(true);
                                f.getIssues().add("AMOUNT_MISMATCH_ONCHAIN_VS_DB");
                                if (!f.getTamperedFields().contains("amount")) f.getTamperedFields().add("amount");
                            }
                            dbWei = null;
                        }

                        if (dbWei != null && !dbWei.equals(onChainWei)) {
                            f.setTampered(true);
                            f.getIssues().add("AMOUNT_MISMATCH_ONCHAIN_VS_DB");
                            if (!f.getTamperedFields().contains("amount")) f.getTamperedFields().add("amount");
                        }
                    }
                }
            }

            if (f.isTampered()) tamperingDetected = true;
            findings.add(f);
        }

        result.setTransactionFindings(findings);
        result.setTamperingDetected(tamperingDetected);
        if (tamperingDetected) {
            result.getWarnings().add("WARNING: Possible tampering detected. Review findings.");
        }
        return result;
    }
}

