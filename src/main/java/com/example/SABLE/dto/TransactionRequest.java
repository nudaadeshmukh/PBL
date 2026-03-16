package com.example.SABLE.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

/**
 * DTO (Data Transfer Object) for creating a new transaction via the API.
 *
 * Why use a DTO instead of exposing the Entity (Transaction) directly?
 * - API contract control: Clients send only the fields we allow (transactionId, sender,
 *   receiver, amount). We do not accept 'id' or 'timestamp' from the client, so they
 *   cannot set primary keys or forge timestamps.
 * - Validation: We apply Bean Validation annotations here. When the controller uses
 *   @Valid on this type, Spring validates the request body before it reaches the
 *   service, returning 400 with error details if validation fails.
 * - Decoupling: The persistence model (entity) can evolve (e.g. new columns, indexes)
 *   without changing the API. We can have multiple DTOs (e.g. TransactionRequest,
 *   TransactionUpdateRequest) for different operations.
 * - Security: Reduces over-posting and keeps internal entity structure hidden from
 *   API consumers.
 */
public class TransactionRequest {

    /**
     * Unique business identifier for the transaction. Must not be blank so that
     * every transaction has a meaningful reference.
     */
    @NotBlank(message = "Transaction ID must not be blank")
    private String transactionId;

    /**
     * Identifier of the sender (e.g. account or wallet).
     */
    @NotBlank(message = "Sender must not be blank")
    private String sender;

    /**
     * Identifier of the receiver.
     */
    @NotBlank(message = "Receiver must not be blank")
    private String receiver;

    /**
     * Transfer amount. @Positive ensures value > 0; zero or negative amounts
     * are rejected with a validation error before any business logic runs.
     */
    @Positive(message = "Amount must be greater than 0")
    private Double amount;

    public TransactionRequest() {
    }

    public TransactionRequest(String transactionId, String sender, String receiver, Double amount) {
        this.transactionId = transactionId;
        this.sender = sender;
        this.receiver = receiver;
        this.amount = amount;
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
}
