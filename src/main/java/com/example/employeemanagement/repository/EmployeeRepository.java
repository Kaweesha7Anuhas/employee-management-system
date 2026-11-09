package com.example.employeemanagement.repository;

import com.example.employeemanagement.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository interface for Employee entity operations.
 * Spring dynamically creates the proxy implementation class at runtime.
 */
@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    // 1. Search by exact unique employee code
    Optional<Employee> findByEmployeeCode(String employeeCode);

    // 2. Uniqueness validation checks for CREATE operations
    boolean existsByEmployeeCode(String employeeCode);
    boolean existsByEmail(String email);

    // 3. Uniqueness validation checks for UPDATE operations (excluding current employee ID)
    boolean existsByEmployeeCodeAndIdNot(String employeeCode, Long id);
    boolean existsByEmailAndIdNot(String email, Long id);

    // 4. Search employees by first name or last name (case-insensitive substring match)
    List<Employee> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(String firstName, String lastName);

    // 5. Filter employees by department
    List<Employee> findByDepartment(String department);

    // 6. Filter employees by employment status ("ACTIVE" or "INACTIVE")
    List<Employee> findByEmploymentStatus(String employmentStatus);

    // 7. Filter employees by department and status simultaneously
    List<Employee> findByDepartmentAndEmploymentStatus(String department, String employmentStatus);

    // 8. Dashboard statistics: Count employees by status
    long countByEmploymentStatus(String employmentStatus);

    // 9. Dashboard statistics: Count distinct departments across all employees
    @Query("SELECT COUNT(DISTINCT e.department) FROM Employee e")
    long countDistinctDepartments();
}