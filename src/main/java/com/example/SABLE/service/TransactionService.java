package com.example.sable.service;

import com.example.sable.dto.TransactionRequest;
import com.example.sable.exception.DuplicateTransactionException;
import com.example.sable.exception.ResourceNotFoundException;
import com.example.sable.model.Transaction;
import com.example.sable.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service layer for transaction business logic.
 *
 * Why the service layer exists:
 * - Controllers should only handle HTTP (mapping URLs, parsing request/response).
 *   Business rules (e.g. "transactionId must be unique", "set timestamp at creation")
 *   belong here so they can be reused by other entry points (e.g. another controller,
 *   a message listener) and are easier to unit test.
 * - We keep the controller thin and the repository focused on persistence; the
 *   service orchestrates validation, entity creation, and repository calls.
 *
 * Why validation belongs here (in addition to DTO validation):
 * - DTO validation (@NotBlank, @Positive) runs at the controller and rejects
 *   malformed input early. Service-layer checks enforce business rules that
 *   go beyond format: e.g. "transactionId must not already exist", "amount > 0"
 *   (also enforced by DTO, but we could add rules like max amount, allowed senders).
 * - Duplicate check is a business rule: we throw DuplicateTransactionException
 *   so the global handler can return 409 Conflict with a clear message.
 *
 * Why we separate controller from repository:
 * - Controller depends on service (interface to the application). Repository is
 *   an implementation detail; the controller never talks to the repository
 *   directly. This keeps dependencies one-way and makes it easy to add caching,
 *   events, or different storage without touching the controller.
 */
@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;

    /**
     * Constructor injection: Spring injects TransactionRepository when creating
     * TransactionService. Prefer this over field injection so dependencies are
     * explicit and the class is easy to test (you can pass a mock repository).
     */
    public TransactionService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    /**
     * Creates a new transaction from the request DTO.
     * - Checks that transactionId does not already exist (business rule).
     * - Validates amount > 0 (also enforced by DTO; defensive check).
     * - Sets timestamp to now (server authority; client cannot forge it).
     * - Converts DTO to entity, saves, and returns the persisted entity.
     */
    @Transactional
    public Transaction createTransaction(TransactionRequest request) {
        if (transactionRepository.findByTransactionId(request.getTransactionId()).isPresent()) {
            throw new DuplicateTransactionException(
                    "Transaction already exists with transactionId: " + request.getTransactionId());
        }
        if (request.getAmount() == null || request.getAmount() <= 0) {
            throw new IllegalArgumentException("Amount must be greater than 0");
        }
        Transaction transaction = new Transaction(
                request.getTransactionId(),
                request.getSender(),
                request.getReceiver(),
                request.getAmount(),
                LocalDateTime.now()
        );
        return transactionRepository.save(transaction);
    }

    /**
     * Returns all transactions. For large datasets consider pagination
     * (e.g. Pageable in repository and controller).
     */
    @Transactional(readOnly = true)
    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    /**
     * Returns the transaction with the given business identifier.
     * Throws ResourceNotFoundException if not found so the global handler
     * can return 404.
     */
    @Transactional(readOnly = true)
    public Transaction getTransactionByTransactionId(String transactionId) {
        return transactionRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Transaction", "transactionId", transactionId));
    }
}
