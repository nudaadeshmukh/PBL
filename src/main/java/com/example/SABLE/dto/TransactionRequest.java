package com.example.sable.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public class TransactionRequest {
    @NotBlank(message = "Transaction ID must not be blank")
    private String transactionId;

    @NotBlank(message = "Sender must not be blank")
    private String sender;

    @NotBlank(message = "Receiver must not be blank")
    private String receiver;

    @Positive(message = "Amount must be greater than 0")
    private Double amount;

    public TransactionRequest() {}

    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }
    public String getReceiver() { return receiver; }
    public void setReceiver(String receiver) { this.receiver = receiver; }
    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }
}

