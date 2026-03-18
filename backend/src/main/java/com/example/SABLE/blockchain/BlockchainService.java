package com.example.sable.blockchain;

import com.example.sable.dto.GanacheBlockDto;
import com.example.sable.dto.GanacheTxDto;
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
import java.util.List;

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
}

