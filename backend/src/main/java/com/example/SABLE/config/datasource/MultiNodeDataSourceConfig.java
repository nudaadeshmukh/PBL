package com.example.sable.config.datasource;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Configuration
@EnableConfigurationProperties(MultiNodeDataSourceProperties.class)
@ConditionalOnProperty(prefix = "multinode.datasource", name = "enabled", havingValue = "true")
public class MultiNodeDataSourceConfig {

    @Bean
    @Primary
    public DataSource dataSource(MultiNodeDataSourceProperties props,
                                 @Value("${spring.datasource.url:}") String fallbackUrl,
                                 @Value("${spring.datasource.username:}") String fallbackUser,
                                 @Value("${spring.datasource.password:}") String fallbackPass,
                                 @Value("${spring.datasource.driver-class-name:com.mysql.cj.jdbc.Driver}") String fallbackDriver) {

        DatabaseNodeProperties primaryProps = props.getPrimary();
        if (isBlank(primaryProps.getUrl())) primaryProps.setUrl(fallbackUrl);
        if (isBlank(primaryProps.getUsername())) primaryProps.setUsername(fallbackUser);
        if (primaryProps.getPassword() == null) primaryProps.setPassword(fallbackPass);
        if (isBlank(primaryProps.getDriverClassName())) primaryProps.setDriverClassName(fallbackDriver);

        if (isBlank(primaryProps.getUrl())) {
            throw new IllegalStateException("multinode.datasource.primary.url (or spring.datasource.url) must be set");
        }

        DataSource primary = buildNodeDataSource(primaryProps, "sable-primary");

        MultiNodeRoutingDataSource routing = new MultiNodeRoutingDataSource();
        Map<Object, Object> targets = new HashMap<>();
        targets.put(MultiNodeRoutingDataSource.PRIMARY_KEY, primary);

        List<DatabaseNodeProperties> replicas = props.getReplicas();
        for (int i = 0; i < replicas.size(); i++) {
            DatabaseNodeProperties rp = replicas.get(i);
            if (isBlank(rp.getUrl())) continue;
            if (isBlank(rp.getDriverClassName())) rp.setDriverClassName(primaryProps.getDriverClassName());
            if (isBlank(rp.getUsername())) rp.setUsername(primaryProps.getUsername());
            if (rp.getPassword() == null) rp.setPassword(primaryProps.getPassword());

            String key = "replica-" + i;
            DataSource replica = buildNodeDataSource(rp, "sable-" + key);
            targets.put(key, replica);
        }

        routing.setTargetDataSources(targets);
        routing.setDefaultTargetDataSource(primary);
        routing.setReplicaKeys(targets.keySet().stream()
                .map(Object::toString)
                .filter(k -> !MultiNodeRoutingDataSource.PRIMARY_KEY.equals(k))
                .toList());
        routing.afterPropertiesSet();
        return routing;
    }

    private DataSource buildNodeDataSource(DatabaseNodeProperties p, String poolName) {
        HikariDataSource ds = DataSourceBuilder.create()
                .type(HikariDataSource.class)
                .driverClassName(p.getDriverClassName())
                .url(p.getUrl())
                .username(p.getUsername())
                .password(p.getPassword())
                .build();
        ds.setPoolName(poolName);
        return ds;
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }
}

