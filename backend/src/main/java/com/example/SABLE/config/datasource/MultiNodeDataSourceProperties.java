package com.example.sable.config.datasource;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

@ConfigurationProperties(prefix = "multinode.datasource")
public class MultiNodeDataSourceProperties {
    private boolean enabled = false;
    private DatabaseNodeProperties primary = new DatabaseNodeProperties();
    private List<DatabaseNodeProperties> replicas = new ArrayList<>();

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public DatabaseNodeProperties getPrimary() {
        return primary;
    }

    public void setPrimary(DatabaseNodeProperties primary) {
        this.primary = primary;
    }

    public List<DatabaseNodeProperties> getReplicas() {
        return replicas;
    }

    public void setReplicas(List<DatabaseNodeProperties> replicas) {
        this.replicas = replicas;
    }
}

