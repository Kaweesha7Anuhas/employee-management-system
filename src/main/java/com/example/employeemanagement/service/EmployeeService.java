package com.example.employeemanagement.service;

import com.example.employeemanagement.dto.DashboardStatsDTO;
import com.example.employeemanagement.dto.EmployeeRequestDTO;
import com.example.employeemanagement.dto.EmployeeResponseDTO;
import com.example.employeemanagement.entity.Employee;
import com.example.employeemanagement.exception.DuplicateResourceException;
import com.example.employeemanagement.exception.EmployeeNotFoundException;
import com.example.employeemanagement.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service class handling all business logic, data validation,
 * transaction boundaries, and entity-DTO transformations for Employees.
 */
@Service
@Transactional(readOnly = true)
public class EmployeeService {

    private final EmployeeRepository employeeRepository;

    // Constructor injection: Spring automatically injects the EmployeeRepository bean
    public EmployeeService(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    /**
     * Creates and persists a new employee record after validating unique constraints.
     */
    @Transactional
    public EmployeeResponseDTO createEmployee(EmployeeRequestDTO requestDTO) {
        // 1. Check if employeeCode already exists
        if (employeeRepository.existsByEmployeeCode(requestDTO.getEmployeeCode().trim())) {
            throw new DuplicateResourceException(
                    "Employee code '" + requestDTO.getEmployeeCode().trim() + "' is already registered"
            );
        }

        // 2. Check if email already exists
        if (employeeRepository.existsByEmail(requestDTO.getEmail().trim().toLowerCase())) {
            throw new DuplicateResourceException(
                    "Email address '" + requestDTO.getEmail().trim().toLowerCase() + "' is already registered"
            );
        }

        // 3. Map DTO to Entity
        Employee employee = new Employee();
        mapDtoToEntity(requestDTO, employee);

        // 4. Save to MySQL via Spring Data JPA
        Employee savedEmployee = employeeRepository.save(employee);

        // 5. Return formatted Response DTO
        return EmployeeResponseDTO.fromEntity(savedEmployee);
    }

    /**
     * Retrieves all employees formatted as Response DTOs.
     */
    public List<EmployeeResponseDTO> getAllEmployees() {
        return employeeRepository.findAll()
                .stream()
                .map(EmployeeResponseDTO::fromEntity)
                .toList();
    }

    /**
     * Retrieves an individual employee by primary key ID.
     */
    public EmployeeResponseDTO getEmployeeById(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new EmployeeNotFoundException("Employee not found with ID: " + id));

        return EmployeeResponseDTO.fromEntity(employee);
    }

    /**
     * Retrieves an individual employee by unique Employee Code.
     */
    public EmployeeResponseDTO getEmployeeByCode(String employeeCode) {
        Employee employee = employeeRepository.findByEmployeeCode(employeeCode.trim())
                .orElseThrow(() -> new EmployeeNotFoundException("Employee not found with code: " + employeeCode.trim()));

        return EmployeeResponseDTO.fromEntity(employee);
    }

    /**
     * Updates an existing employee record after validating existence and uniqueness against other records.
     */
    @Transactional
    public EmployeeResponseDTO updateEmployee(Long id, EmployeeRequestDTO requestDTO) {
        // 1. Verify that the employee exists
        Employee existingEmployee = employeeRepository.findById(id)
                .orElseThrow(() -> new EmployeeNotFoundException("Cannot update. Employee not found with ID: " + id));

        String sanitizedCode = requestDTO.getEmployeeCode().trim();
        String sanitizedEmail = requestDTO.getEmail().trim().toLowerCase();

        // 2. Check if the updated employeeCode is already taken by another employee
        if (employeeRepository.existsByEmployeeCodeAndIdNot(sanitizedCode, id)) {
            throw new DuplicateResourceException(
                    "Employee code '" + sanitizedCode + "' is already in use by another employee"
            );
        }

        // 3. Check if the updated email is already taken by another employee
        if (employeeRepository.existsByEmailAndIdNot(sanitizedEmail, id)) {
            throw new DuplicateResourceException(
                    "Email address '" + sanitizedEmail + "' is already in use by another employee"
            );
        }

        // 4. Update mutable fields
        mapDtoToEntity(requestDTO, existingEmployee);

        // 5. Persist updates (Hibernate triggers @PreUpdate)
        Employee updatedEmployee = employeeRepository.save(existingEmployee);

        return EmployeeResponseDTO.fromEntity(updatedEmployee);
    }

    /**
     * Deletes an employee record by primary key ID.
     */
    @Transactional
    public void deleteEmployee(Long id) {
        if (!employeeRepository.existsById(id)) {
            throw new EmployeeNotFoundException("Cannot delete. Employee not found with ID: " + id);
        }
        employeeRepository.deleteById(id);
    }

    /**
     * Searches employees by first name or last name (case-insensitive substring match).
     */
    public List<EmployeeResponseDTO> searchEmployeesByName(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAllEmployees();
        }

        String trimmedQuery = query.trim();
        return employeeRepository.findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(trimmedQuery, trimmedQuery)
                .stream()
                .map(EmployeeResponseDTO::fromEntity)
                .toList();
    }

    /**
     * Filters employees dynamically by department, employment status, or both.
     */
    public List<EmployeeResponseDTO> filterEmployees(String department, String status) {
        boolean hasDepartment = department != null && !department.trim().isEmpty();
        boolean hasStatus = status != null && !status.trim().isEmpty();

        List<Employee> employees;

        if (hasDepartment && hasStatus) {
            employees = employeeRepository.findByDepartmentAndEmploymentStatus(department.trim(), status.trim());
        } else if (hasDepartment) {
            employees = employeeRepository.findByDepartment(department.trim());
        } else if (hasStatus) {
            employees = employeeRepository.findByEmploymentStatus(status.trim());
        } else {
            employees = employeeRepository.findAll();
        }

        return employees.stream()
                .map(EmployeeResponseDTO::fromEntity)
                .toList();
    }

    /**
     * Calculates and returns live dashboard overview statistics.
     */
    public DashboardStatsDTO getDashboardStats() {
        long totalEmployees = employeeRepository.count();
        long activeEmployees = employeeRepository.countByEmploymentStatus("ACTIVE");
        long inactiveEmployees = employeeRepository.countByEmploymentStatus("INACTIVE");
        long totalDepartments = employeeRepository.countDistinctDepartments();

        return new DashboardStatsDTO(totalEmployees, activeEmployees, inactiveEmployees, totalDepartments);
    }

    /**
     * Helper method to map fields from EmployeeRequestDTO to an Employee Entity.
     */
    private void mapDtoToEntity(EmployeeRequestDTO dto, Employee employee) {
        employee.setEmployeeCode(dto.getEmployeeCode().trim());
        employee.setFirstName(dto.getFirstName().trim());
        employee.setLastName(dto.getLastName().trim());
        employee.setEmail(dto.getEmail().trim().toLowerCase());
        employee.setPhoneNumber(dto.getPhoneNumber().trim());
        employee.setDepartment(dto.getDepartment().trim());
        employee.setJobTitle(dto.getJobTitle().trim());
        employee.setSalary(dto.getSalary());
        employee.setHireDate(dto.getHireDate());
        employee.setEmploymentStatus(dto.getEmploymentStatus().trim().toUpperCase());
    }
}