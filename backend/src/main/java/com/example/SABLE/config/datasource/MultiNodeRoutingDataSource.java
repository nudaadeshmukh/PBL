package com.example.sable.config.datasource;

import org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

public class MultiNodeRoutingDataSource extends AbstractRoutingDataSource {
    public static final String PRIMARY_KEY = "primary";

    private final List<String> replicaKeys = new ArrayList<>();
    private final AtomicInteger idx = new AtomicInteger(0);

    public void setReplicaKeys(List<String> keys) {
        replicaKeys.clear();
        replicaKeys.addAll(keys);
    }

    @Override
    protected Object determineCurrentLookupKey() {
        // Route read-only transactions to replicas (round-robin),
        // everything else (writes/non-transactional) to primary.
        if (!TransactionSynchronizationManager.isCurrentTransactionReadOnly()) {
            return PRIMARY_KEY;
        }
        if (replicaKeys.isEmpty()) {
            return PRIMARY_KEY;
        }
        int i = Math.floorMod(idx.getAndIncrement(), replicaKeys.size());
        return replicaKeys.get(i);
    }
}

