package com.example.employeemanagement.controller;

import com.example.employeemanagement.dto.DashboardStatsDTO;
import com.example.employeemanagement.dto.EmployeeRequestDTO;
import com.example.employeemanagement.dto.EmployeeResponseDTO;
import com.example.employeemanagement.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST Controller exposing HTTP endpoints for the Employee Management System.
 * Delegates all business operations to EmployeeService and returns JSON responses.
 */
@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private final EmployeeService employeeService;

    // Constructor injection: Spring automatically injects the EmployeeService bean
    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    /**
     * 1. CREATE - Add a new employee
     * POST /api/employees
     */
    @PostMapping
    public ResponseEntity<EmployeeResponseDTO> createEmployee(@Valid @RequestBody EmployeeRequestDTO requestDTO) {
        EmployeeResponseDTO createdEmployee = employeeService.createEmployee(requestDTO);
        return new ResponseEntity<>(createdEmployee, HttpStatus.CREATED);
    }

    /**
     * 2. READ ALL - Retrieve all employees
     * GET /api/employees
     */
    @GetMapping
    public ResponseEntity<List<EmployeeResponseDTO>> getAllEmployees() {
        List<EmployeeResponseDTO> employees = employeeService.getAllEmployees();
        return ResponseEntity.ok(employees);
    }

    /**
     * 3. READ ONE - Retrieve an employee by primary key ID
     * GET /api/employees/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<EmployeeResponseDTO> getEmployeeById(@PathVariable Long id) {
        EmployeeResponseDTO employee = employeeService.getEmployeeById(id);
        return ResponseEntity.ok(employee);
    }

    /**
     * 4. READ BY CODE - Retrieve an employee by unique Employee Code
     * GET /api/employees/code/{employeeCode}
     */
    @GetMapping("/code/{employeeCode}")
    public ResponseEntity<EmployeeResponseDTO> getEmployeeByCode(@PathVariable String employeeCode) {
        EmployeeResponseDTO employee = employeeService.getEmployeeByCode(employeeCode);
        return ResponseEntity.ok(employee);
    }

    /**
     * 5. UPDATE - Update an existing employee by ID
     * PUT /api/employees/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<EmployeeResponseDTO> updateEmployee(
            @PathVariable Long id,
            @Valid @RequestBody EmployeeRequestDTO requestDTO) {
        EmployeeResponseDTO updatedEmployee = employeeService.updateEmployee(id, requestDTO);
        return ResponseEntity.ok(updatedEmployee);
    }

    /**
     * 6. DELETE - Remove an employee by ID
     * DELETE /api/employees/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEmployee(@PathVariable Long id) {
        employeeService.deleteEmployee(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * 7. SEARCH - Search employees by first or last name
     * GET /api/employees/search?query=John
     */
    @GetMapping("/search")
    public ResponseEntity<List<EmployeeResponseDTO>> searchEmployees(
            @RequestParam(required = false, defaultValue = "") String query) {
        List<EmployeeResponseDTO> results = employeeService.searchEmployeesByName(query);
        return ResponseEntity.ok(results);
    }

    /**
     * 8. FILTER - Filter employees by department and/or status
     * GET /api/employees/filter?department=IT&status=ACTIVE
     */
    @GetMapping("/filter")
    public ResponseEntity<List<EmployeeResponseDTO>> filterEmployees(
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String status) {
        List<EmployeeResponseDTO> results = employeeService.filterEmployees(department, status);
        return ResponseEntity.ok(results);
    }

    /**
     * 9. DASHBOARD STATS - Retrieve aggregate counts for summary cards
     * GET /api/employees/statistics
     */
    @GetMapping("/statistics")
    public ResponseEntity<DashboardStatsDTO> getDashboardStatistics() {
        DashboardStatsDTO stats = employeeService.getDashboardStats();
        return ResponseEntity.ok(stats);
    }
}