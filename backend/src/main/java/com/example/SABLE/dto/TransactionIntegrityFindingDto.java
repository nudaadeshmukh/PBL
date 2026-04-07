package com.example.sable.dto;

import java.util.ArrayList;
import java.util.List;

public class TransactionIntegrityFindingDto {
    private String transactionId;
    private Long dbId;
    private Boolean onChain;
    private String blockchainTxHash;

    private boolean tampered;
    private boolean unverifiable;

    private List<String> tamperedFields = new ArrayList<>();
    private List<String> issues = new ArrayList<>();

    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
    public Long getDbId() { return dbId; }
    public void setDbId(Long dbId) { this.dbId = dbId; }
    public Boolean getOnChain() { return onChain; }
    public void setOnChain(Boolean onChain) { this.onChain = onChain; }
    public String getBlockchainTxHash() { return blockchainTxHash; }
    public void setBlockchainTxHash(String blockchainTxHash) { this.blockchainTxHash = blockchainTxHash; }
    public boolean isTampered() { return tampered; }
    public void setTampered(boolean tampered) { this.tampered = tampered; }
    public boolean isUnverifiable() { return unverifiable; }
    public void setUnverifiable(boolean unverifiable) { this.unverifiable = unverifiable; }
    public List<String> getTamperedFields() { return tamperedFields; }
    public void setTamperedFields(List<String> tamperedFields) { this.tamperedFields = tamperedFields; }
    public List<String> getIssues() { return issues; }
    public void setIssues(List<String> issues) { this.issues = issues; }
}

