package com.example.sable.dto;

import java.util.List;

public class GanacheBlockDto {
    private long blockNumber;
    private Long timestampMs;
    private String blockHash;
    private String previousBlockHash;
    private List<GanacheTxDto> transactions;

    public GanacheBlockDto() {}

    public long getBlockNumber() { return blockNumber; }
    public void setBlockNumber(long blockNumber) { this.blockNumber = blockNumber; }

    public Long getTimestampMs() { return timestampMs; }
    public void setTimestampMs(Long timestampMs) { this.timestampMs = timestampMs; }

    public String getBlockHash() { return blockHash; }
    public void setBlockHash(String blockHash) { this.blockHash = blockHash; }

    public String getPreviousBlockHash() { return previousBlockHash; }
    public void setPreviousBlockHash(String previousBlockHash) { this.previousBlockHash = previousBlockHash; }

    public List<GanacheTxDto> getTransactions() { return transactions; }
    public void setTransactions(List<GanacheTxDto> transactions) { this.transactions = transactions; }
}

