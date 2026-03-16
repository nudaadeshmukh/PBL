package com.example.SABLE.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * JPA Entity representing a financial transaction in the SABLE system.
 *
 * This class is mapped to a database table. JPA (Java Persistence API) manages the
 * lifecycle of this entity: creating table schema (when ddl-auto=update), inserting,
 * updating, and querying rows. We use this entity for persistence only; API request
 * data is received via DTOs (e.g. TransactionRequest) to avoid exposing the entity
 * structure and to allow different validation rules.
 *
 * How JPA works (briefly):
 * - The persistence context (managed by Hibernate) tracks entity instances.
 * - When you call repository.save(entity), JPA either INSERTs a new row or UPDATEs
 *   an existing one based on whether the entity has an id set.
 * - Queries (e.g. findAll(), findByTransactionId()) are translated to SQL by
 *   Spring Data JPA / Hibernate.
 */
@Entity
@Table(name = "transactions")
public class Transaction {

    /**
     * Primary key. @GeneratedValue(strategy = GenerationType.IDENTITY) uses the
     * database's auto-increment (e.g. MySQL AUTO_INCREMENT) so the application
     * does not need to set this value; the database assigns it on insert.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Business identifier for the transaction (e.g. external reference). Must be
     * unique across all rows so we can look up a transaction by this id without
     * exposing the internal database id. Unique constraint is enforced at DB level
     * via the unique constraint on the column and/or by service-layer checks.
     */
    @NotBlank(message = "Transaction ID must not be blank")
    @Column(name = "transaction_id", nullable = false, unique = true, length = 255)
    private String transactionId;

    /**
     * Identifier of the party sending the funds (e.g. account id or wallet address).
     */
    @NotBlank(message = "Sender must not be blank")
    @Column(nullable = false, length = 255)
    private String sender;

    /**
     * Identifier of the party receiving the funds.
     */
    @NotBlank(message = "Receiver must not be blank")
    @Column(nullable = false, length = 255)
    private String receiver;

    /**
     * Transfer amount. Must be positive; zero or negative transfers are not allowed.
     * Using double for simplicity; in production consider BigDecimal for currency.
     */
    @NotNull(message = "Amount must not be null")
    @Positive(message = "Amount must be greater than 0")
    @Column(nullable = false)
    private Double amount;

    /**
     * Time when the transaction was recorded. Set by the service layer (e.g. at
     * creation time) so clients cannot forge timestamps.
     */
    @NotNull
    @Column(nullable = false)
    private LocalDateTime timestamp;

    /**
     * No-argument constructor required by JPA for entity instantiation and
     * reflection-based persistence operations.
     */
    public Transaction() {
    }

    /**
     * Constructor for creating an entity with all fields (e.g. from a DTO in the service).
     */
    public Transaction(String transactionId, String sender, String receiver, Double amount, LocalDateTime timestamp) {
        this.transactionId = transactionId;
        this.sender = sender;
        this.receiver = receiver;
        this.amount = amount;
        this.timestamp = timestamp;
    }

    // --- Getters and setters (required by JPA for property access) ---

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    public String getSender() {
        return sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }

    public String getReceiver() {
        return receiver;
    }

    public void setReceiver(String receiver) {
        this.receiver = receiver;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Transaction that = (Transaction) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
