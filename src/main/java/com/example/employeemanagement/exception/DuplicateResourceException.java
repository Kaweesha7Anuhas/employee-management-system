package com.example.employeemanagement.exception;

/**
 * Custom unchecked exception thrown when an attempt is made to create or update
 * an employee with a unique property (such as employeeCode or email) that already exists.
 */
public class DuplicateResourceException extends RuntimeException {

    /**
     * Constructs a new DuplicateResourceException with the specified detail message.
     *
     * @param message The detailed error message describing the unique constraint conflict.
     */
    public DuplicateResourceException(String message) {
        super(message);
    }
}