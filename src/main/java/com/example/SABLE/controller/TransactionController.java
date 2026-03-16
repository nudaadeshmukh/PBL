package com.example.SABLE.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.SABLE.dto.TransactionRequest;
import com.example.SABLE.model.Transaction;
import com.example.SABLE.service.TransactionService;

import java.util.List;

/**
 * REST controller for transaction endpoints.
 *
 * @RestController = @Controller + @ResponseBody on every method. So each method
 * return value is serialized to the response body (e.g. JSON via Jackson) instead
 * of being interpreted as a view name. Perfect for REST APIs.
 *
 * @RequestBody: Binds the HTTP request body to the method parameter. Spring uses
 * the Content-Type (e.g. application/json) to deserialize the body into the
 * TransactionRequest object. If the JSON does not match the DTO structure or
 * types, deserialization can fail; combined with @Valid, we also run bean validation.
 *
 * @Valid: Triggers Bean Validation (JSR 380) on the TransactionRequest after
 * deserialization. If any constraint fails (@NotBlank, @Positive), Spring throws
 * MethodArgumentNotValidException and does not call the method. Our
 * GlobalExceptionHandler turns that into a 400 response with validation messages.
 *
 * ResponseEntity: Represents the full HTTP response (status code, headers, body).
 * We use it to set 201 CREATED for POST and to return the created entity in the body.
 * For GET we could return List<Transaction> or Transaction directly; Spring would
 * use 200 OK by default. Using ResponseEntity is explicit and allows setting headers
 * (e.g. Location for created resource) when needed.
 */
@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    /**
     * Constructor injection: Spring injects TransactionService when creating
     * this controller. Dependencies are explicit and testable.
     */
    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    /**
     * POST /api/transactions
     * Creates a new transaction. Request body must be valid JSON matching TransactionRequest.
     * Returns 201 CREATED with the saved transaction in the body.
     */
    @PostMapping
    public ResponseEntity<Transaction> createTransaction(@Valid @RequestBody TransactionRequest request) {
        Transaction created = transactionService.createTransaction(request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    /**
     * GET /api/transactions
     * Returns all transactions (200 OK).
     */
    @GetMapping
    public ResponseEntity<List<Transaction>> getAllTransactions() {
        List<Transaction> transactions = transactionService.getAllTransactions();
        return ResponseEntity.ok(transactions);
    }

    /**
     * GET /api/transactions/{transactionId}
     * Returns the transaction with the given transactionId. Returns 404 if not found.
     */
    @GetMapping("/{transactionId}")
    public ResponseEntity<Transaction> getTransactionByTransactionId(@PathVariable String transactionId) {
        Transaction transaction = transactionService.getTransactionByTransactionId(transactionId);
        return ResponseEntity.ok(transaction);
    }

    /**
     * GET /api/transactions/test
     * Simple health/connectivity check: returns "Backend Working".
     */
    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("Backend Working");
    }
}
