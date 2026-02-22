package com.example.sable.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Centralized exception handling for the application.
 *
 * How it works:
 * - @RestControllerAdvice (combination of @ControllerAdvice and @ResponseBody) makes
 *   this class a global handler for exceptions thrown by any @RestController.
 * - When an exception is thrown and not handled in a controller, Spring MVC looks
 *   for an @ExceptionHandler method in this class that matches the exception type.
 * - The matching handler returns a ResponseEntity (or a body that gets serialized to
 *   JSON), which becomes the HTTP response. This way we never leak stack traces or
 *   inconsistent error formats to the client.
 *
 * Benefits:
 * - Single place to define error response structure (timestamp, status, error, message, path).
 * - Controllers and services can throw domain exceptions (e.g. ResourceNotFoundException)
 *   without converting them to HTTP status codes; this handler does the mapping.
 * - Validation errors from @Valid are collected and returned as a structured message.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Standard structure for error responses. All handlers return a body with
     * these fields so clients can parse errors consistently.
     */
    private Map<String, Object> errorBody(HttpStatus status, String error, String message, WebRequest request) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", status.value());
        body.put("error", error);
        body.put("message", message);
        body.put("path", request.getDescription(false).replace("uri=", ""));
        return body;
    }

    /**
     * Duplicate transactionId: return 409 Conflict with a clear message.
     */
    @ExceptionHandler(DuplicateTransactionException.class)
    public ResponseEntity<Map<String, Object>> handleDuplicateTransaction(
            DuplicateTransactionException ex,
            WebRequest request) {
        Map<String, Object> body = errorBody(
                HttpStatus.CONFLICT,
                "Conflict",
                ex.getMessage(),
                request);
        return new ResponseEntity<>(body, HttpStatus.CONFLICT);
    }

    /**
     * Transaction (or other resource) not found: return 404 Not Found.
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleResourceNotFound(
            ResourceNotFoundException ex,
            WebRequest request) {
        Map<String, Object> body = errorBody(
                HttpStatus.NOT_FOUND,
                "Not Found",
                ex.getMessage(),
                request);
        return new ResponseEntity<>(body, HttpStatus.NOT_FOUND);
    }

    /**
     * Validation errors from @Valid (e.g. @NotBlank, @Positive) on request DTOs.
     * MethodArgumentNotValidException is thrown when validation fails; we collect
     * field errors and return them as a single message (or you could expose a
     * list of field errors in the body for finer-grained client handling).
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(
            MethodArgumentNotValidException ex,
            WebRequest request) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .collect(Collectors.joining("; "));
        Map<String, Object> body = errorBody(
                HttpStatus.BAD_REQUEST,
                "Validation Failed",
                message,
                request);
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    /**
     * Catch-all for any other exception (e.g. NullPointerException, database errors).
     * In production you might log the exception and return a generic message
     * instead of the exception message to avoid leaking internal details.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(
            Exception ex,
            WebRequest request) {
        Map<String, Object> body = errorBody(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Internal Server Error",
                ex.getMessage() != null ? ex.getMessage() : "An unexpected error occurred",
                request);
        return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
