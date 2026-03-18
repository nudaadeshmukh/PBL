package com.example.sable.dto;

public class GanacheTxDto {
    private String txHash;
    private String senderAddress;
    private String receiverAddress;
    private String amountWei;
    private String amountEth;

    public GanacheTxDto() {}

    public String getTxHash() { return txHash; }
    public void setTxHash(String txHash) { this.txHash = txHash; }

    public String getSenderAddress() { return senderAddress; }
    public void setSenderAddress(String senderAddress) { this.senderAddress = senderAddress; }

    public String getReceiverAddress() { return receiverAddress; }
    public void setReceiverAddress(String receiverAddress) { this.receiverAddress = receiverAddress; }

    public String getAmountWei() { return amountWei; }
    public void setAmountWei(String amountWei) { this.amountWei = amountWei; }

    public String getAmountEth() { return amountEth; }
    public void setAmountEth(String amountEth) { this.amountEth = amountEth; }
}

