package com.example.sable.blockchain;

import com.example.sable.model.Transaction;
import com.example.sable.service.TransactionService;
import org.springframework.stereotype.Service;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.http.HttpService;
import org.web3j.tx.Transfer;
import org.web3j.utils.Convert;
import org.web3j.crypto.WalletUtils;

import java.math.BigDecimal;
import java.util.List;

@Service
public class BlockchainService {

    // TODO: move to configuration / environment variable for production use
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
        BigDecimal amount = BigDecimal.valueOf(tx.getAmount());

        var receipt = Transfer.sendFunds(
                web3j,
                credentials,
                toAddress,
                amount,
                Convert.Unit.ETHER
        ).send();

        tx.setOnChain(true);
        transactionService.save(tx);

        return receipt.getTransactionHash();
    }

    public void syncAllTransactionsToBlockchain() throws Exception {
        List<Transaction> transactions = transactionService.getUnsyncedTransactions();

        for (Transaction tx : transactions) {
            Credentials credentials = Credentials.create(SENDER_PRIVATE_KEY);

            String toAddress = tx.getReceiver();
            BigDecimal amount = BigDecimal.valueOf(tx.getAmount());

            if (!WalletUtils.isValidAddress(toAddress)) {
                throw new IllegalArgumentException("Invalid Ethereum address in receiver: " + toAddress);
            }

            var receipt = Transfer.sendFunds(
                    web3j,
                    credentials,
                    toAddress,
                    amount,
                    Convert.Unit.ETHER
            ).send();

            tx.setOnChain(true);
            transactionService.save(tx);

            System.out.println("On-chain tx hash for " + tx.getTransactionId() + ": " +
                    receipt.getTransactionHash());
        }
    }
}
