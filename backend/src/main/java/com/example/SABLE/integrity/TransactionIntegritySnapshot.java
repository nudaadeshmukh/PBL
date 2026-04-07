package com.example.sable.integrity;

import com.example.sable.model.Transaction;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;

public final class TransactionIntegritySnapshot {
    private static final DateTimeFormatter TS_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private TransactionIntegritySnapshot() {}

    public static Snapshot compute(Transaction tx) {
        String transactionId = safe(tx.getTransactionId());
        String sender = safe(tx.getSender());
        String receiver = safe(tx.getReceiver());
        String amount = tx.getAmount() == null ? "" : new BigDecimal(tx.getAmount().toString()).stripTrailingZeros().toPlainString();
        String timestamp = tx.getTimestamp() == null ? "" : TS_FMT.format(tx.getTimestamp());

        String txIdHash = IntegrityHasher.sha256Hex(transactionId);
        String senderHash = IntegrityHasher.sha256Hex(sender);
        String receiverHash = IntegrityHasher.sha256Hex(receiver);
        String amountHash = IntegrityHasher.sha256Hex(amount);
        String timestampHash = IntegrityHasher.sha256Hex(timestamp);

        // Overall record hash ties the normalized field values together.
        String recordHash = IntegrityHasher.sha256Hex(String.join("|",
                "v1",
                transactionId,
                sender,
                receiver,
                amount,
                timestamp
        ));

        return new Snapshot(recordHash, txIdHash, senderHash, receiverHash, amountHash, timestampHash);
    }

    private static String safe(String s) {
        return s == null ? "" : s;
    }

    public record Snapshot(
            String recordHash,
            String transactionIdHash,
            String senderHash,
            String receiverHash,
            String amountHash,
            String timestampHash
    ) {}
}

