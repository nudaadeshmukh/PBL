package com.example.sable.exception;

/**
 * Thrown when an attempt is made to create a transaction with a transactionId
 * that already exists in the system.
 *
 * Enforcing uniqueness of transactionId at the service layer allows us to return
 * a clear 409 Conflict (or 400 Bad Request) with a structured message, instead
 * of letting the database unique constraint surface as a generic persistence error.
 */
public class DuplicateTransactionException extends RuntimeException {

    public DuplicateTransactionException(String message) {
        super(message);
    }
}
