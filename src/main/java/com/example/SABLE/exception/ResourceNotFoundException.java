package com.example.sable.exception;

/**
 * Thrown when a requested resource (e.g. a transaction) does not exist.
 *
 * The service layer throws this when a lookup by transactionId (or id) finds no
 * result. The GlobalExceptionHandler catches it and returns a 404 Not Found
 * response with a consistent JSON structure, so clients can handle "not found"
 * cases uniformly without parsing exception messages.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s not found with %s : '%s'", resourceName, fieldName, fieldValue));
    }
}
