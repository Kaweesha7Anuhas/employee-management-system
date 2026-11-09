package com.example.employeemanagement.exception;

/**
 * Custom unchecked exception thrown when an employee record
 * cannot be located in the database by its identifier (ID or Employee Code).
 */
public class EmployeeNotFoundException extends RuntimeException {

    /**
     * Constructs a new EmployeeNotFoundException with the specified detail message.
     *
     * @param message The detailed error message explaining why the lookup failed.
     */
    public EmployeeNotFoundException(String message) {
        super(message);
    }
}