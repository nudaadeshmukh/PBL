package com.example.sable.dto;

import java.util.ArrayList;
import java.util.List;

public class BlockchainVerificationDto {
    private boolean chainLinkageValid;
    private int blocksChecked;
    private boolean tamperingDetected;
    private List<String> warnings = new ArrayList<>();

    private List<GanacheBlockDto> blocks = new ArrayList<>();
    private List<TransactionIntegrityFindingDto> transactionFindings = new ArrayList<>();

    public boolean isChainLinkageValid() { return chainLinkageValid; }
    public void setChainLinkageValid(boolean chainLinkageValid) { this.chainLinkageValid = chainLinkageValid; }
    public int getBlocksChecked() { return blocksChecked; }
    public void setBlocksChecked(int blocksChecked) { this.blocksChecked = blocksChecked; }
    public boolean isTamperingDetected() { return tamperingDetected; }
    public void setTamperingDetected(boolean tamperingDetected) { this.tamperingDetected = tamperingDetected; }
    public List<String> getWarnings() { return warnings; }
    public void setWarnings(List<String> warnings) { this.warnings = warnings; }
    public List<GanacheBlockDto> getBlocks() { return blocks; }
    public void setBlocks(List<GanacheBlockDto> blocks) { this.blocks = blocks; }
    public List<TransactionIntegrityFindingDto> getTransactionFindings() { return transactionFindings; }
    public void setTransactionFindings(List<TransactionIntegrityFindingDto> transactionFindings) { this.transactionFindings = transactionFindings; }
}

