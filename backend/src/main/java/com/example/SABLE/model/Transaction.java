package com.example.sable.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
public class Transaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(name = "transaction_id", nullable = false, unique = true)
    private String transactionId;

    @NotBlank
    @Column(nullable = false)
    private String sender;

    @NotBlank
    @Column(nullable = false)
    private String receiver;

    @NotNull
    @Positive
    @Column(nullable = false)
    private Double amount;

    @NotNull
    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(nullable = false)
    private boolean onChain = false;

    @Column(name = "blockchain_tx_hash")
    private String blockchainTxHash;

    // Integrity snapshot hashes (computed at creation time).
    @Column(name = "integrity_record_hash")
    private String integrityRecordHash;

    @Column(name = "integrity_transaction_id_hash")
    private String integrityTransactionIdHash;

    @Column(name = "integrity_sender_hash")
    private String integritySenderHash;

    @Column(name = "integrity_receiver_hash")
    private String integrityReceiverHash;

    @Column(name = "integrity_amount_hash")
    private String integrityAmountHash;

    @Column(name = "integrity_timestamp_hash")
    private String integrityTimestampHash;

    public Transaction() {}

    public Transaction(String transactionId, String sender, String receiver, Double amount, LocalDateTime timestamp) {
        this.transactionId = transactionId;
        this.sender = sender;
        this.receiver = receiver;
        this.amount = amount;
        this.timestamp = timestamp;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }
    public String getReceiver() { return receiver; }
    public void setReceiver(String receiver) { this.receiver = receiver; }
    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    public boolean isOnChain() { return onChain; }
    public void setOnChain(boolean onChain) { this.onChain = onChain; }
    public String getBlockchainTxHash() { return blockchainTxHash; }
    public void setBlockchainTxHash(String blockchainTxHash) { this.blockchainTxHash = blockchainTxHash; }

    public String getIntegrityRecordHash() { return integrityRecordHash; }
    public void setIntegrityRecordHash(String integrityRecordHash) { this.integrityRecordHash = integrityRecordHash; }
    public String getIntegrityTransactionIdHash() { return integrityTransactionIdHash; }
    public void setIntegrityTransactionIdHash(String integrityTransactionIdHash) { this.integrityTransactionIdHash = integrityTransactionIdHash; }
    public String getIntegritySenderHash() { return integritySenderHash; }
    public void setIntegritySenderHash(String integritySenderHash) { this.integritySenderHash = integritySenderHash; }
    public String getIntegrityReceiverHash() { return integrityReceiverHash; }
    public void setIntegrityReceiverHash(String integrityReceiverHash) { this.integrityReceiverHash = integrityReceiverHash; }
    public String getIntegrityAmountHash() { return integrityAmountHash; }
    public void setIntegrityAmountHash(String integrityAmountHash) { this.integrityAmountHash = integrityAmountHash; }
    public String getIntegrityTimestampHash() { return integrityTimestampHash; }
    public void setIntegrityTimestampHash(String integrityTimestampHash) { this.integrityTimestampHash = integrityTimestampHash; }
}

