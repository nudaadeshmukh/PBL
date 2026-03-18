package com.example.sable.controller;

import com.example.sable.blockchain.BlockchainService;
import com.example.sable.dto.TransactionRequest;
import com.example.sable.model.Transaction;
import com.example.sable.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;
    private final BlockchainService blockchainService;

    public TransactionController(TransactionService transactionService, BlockchainService blockchainService) {
        this.transactionService = transactionService;
        this.blockchainService = blockchainService;
    }

    @PostMapping
    public ResponseEntity<Transaction> createTransaction(@Valid @RequestBody TransactionRequest request) {
        Transaction created = transactionService.createTransaction(request);
        try {
            // After saving the new transaction, sync all pending DB records to the blockchain.
            blockchainService.syncAllTransactionsToBlockchain();
        } catch (Exception e) {
            // DB write succeeded, but blockchain sync failed.
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Saved to DB, but failed to sync pending transactions to blockchain: " + e.getMessage(),
                    e
            );
        }

        Transaction updated = transactionService.getTransactionByTransactionId(created.getTransactionId());
        return new ResponseEntity<>(updated, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<Transaction>> getAllTransactions() {
        return ResponseEntity.ok(transactionService.getAllTransactions());
    }

    @GetMapping("/{transactionId}")
    public ResponseEntity<Transaction> getTransactionByTransactionId(@PathVariable String transactionId) {
        return ResponseEntity.ok(transactionService.getTransactionByTransactionId(transactionId));
    }

    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("Backend Working");
    }
}

