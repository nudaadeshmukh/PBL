package com.example.sable.service;

import com.example.sable.dto.TransactionRequest;
import com.example.sable.exception.DuplicateTransactionException;
import com.example.sable.exception.ResourceNotFoundException;
import com.example.sable.integrity.TransactionIntegritySnapshot;
import com.example.sable.model.Transaction;
import com.example.sable.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;

    public TransactionService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    @Transactional
    public Transaction createTransaction(TransactionRequest request) {
        if (transactionRepository.findByTransactionId(request.getTransactionId()).isPresent()) {
            throw new DuplicateTransactionException(
                    "Transaction already exists with transactionId: " + request.getTransactionId());
        }
        if (request.getAmount() == null || request.getAmount() <= 0) {
            throw new IllegalArgumentException("Amount must be greater than 0");
        }

        Transaction transaction = new Transaction(
                request.getTransactionId(),
                request.getSender(),
                request.getReceiver(),
                request.getAmount(),
                LocalDateTime.now()
        );

        // Capture an integrity snapshot at creation time (used to detect later DB tampering).
        var snap = TransactionIntegritySnapshot.compute(transaction);
        transaction.setIntegrityRecordHash(snap.recordHash());
        transaction.setIntegrityTransactionIdHash(snap.transactionIdHash());
        transaction.setIntegritySenderHash(snap.senderHash());
        transaction.setIntegrityReceiverHash(snap.receiverHash());
        transaction.setIntegrityAmountHash(snap.amountHash());
        transaction.setIntegrityTimestampHash(snap.timestampHash());

        return transactionRepository.save(transaction);
    }

    @Transactional(readOnly = true)
    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Transaction getTransactionByTransactionId(String transactionId) {
        return transactionRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Transaction", "transactionId", transactionId));
    }

    @Transactional(readOnly = true)
    public List<Transaction> getUnsyncedTransactions() {
        return transactionRepository.findByOnChainFalseOrderByIdAsc();
    }

    @Transactional
    public Transaction save(Transaction transaction) {
        return transactionRepository.save(transaction);
    }
}

