package com.example.sable.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.sable.model.Transaction;

import java.util.List;
import java.util.Optional;
/**
 * Spring Data JPA repository for Transaction entities.
 *
 * By extending JpaRepository<Transaction, Long>, we get for free:
 * - save(entity), saveAll(iterable)
 * - findById(id), findAll(), findAllById(iterable)
 * - count(), existsById(id)
 * - delete(entity), deleteById(id), deleteAll()
 *
 * How Spring Data JPA auto-generates queries:
 * - Method names follow the convention "findBy" + PropertyName. Spring parses
 * the
 * method name and generates the JPQL/SQL at startup. For example,
 * findByTransactionId(String transactionId) becomes a query like
 * "SELECT t FROM Transaction t WHERE t.transactionId = :transactionId".
 * - Return type Optional<Transaction> is used when at most one result is
 * expected;
 * the repository handles the query and wraps the result in Optional (empty if
 * not found).
 *
 * @Repository marks this interface as a persistence layer component so Spring
 *             creates a proxy implementation and injects it where needed (e.g.
 *             TransactionService).
 *             We do not write any implementation class; Spring Data provides it
 *             at runtime.
 */
@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    // in TransactionRepository.java
    List<Transaction> findByOnChainFalse();

    /**
     * Finds a single transaction by its business identifier.
     * Spring Data JPA generates: SELECT t FROM Transaction t WHERE t.transactionId
     * = ?1
     *
     * @param transactionId the unique transaction identifier (not the database id)
     * @return Optional containing the transaction if found, empty otherwise
     */
    Optional<Transaction> findByTransactionId(String transactionId);
}
