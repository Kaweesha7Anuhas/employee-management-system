/**
 * ===================================================================
 * EMPLOYEE MANAGEMENT SYSTEM - FRONTEND CONTROLLER (jQuery + AJAX)
 * ===================================================================
 * Handles all UI event listeners, dynamic DOM rendering, AJAX
 * communication with Spring Boot REST APIs, and client/server validation.
 */

// Base API endpoints
const API_BASE_URL = '/api/employees';

// Global state variables
let searchDebounceTimer = null;
let employeeModalInstance = null;
let viewModalInstance = null;
let deleteModalInstance = null;
let liveToastInstance = null;

/**
 * Document Ready - Entry Point
 */
$(document).ready(function () {
    // 1. Initialize Bootstrap Modal and Toast instances
    employeeModalInstance = new bootstrap.Modal(document.getElementById('employeeModal'));
    viewModalInstance = new bootstrap.Modal(document.getElementById('viewEmployeeModal'));
    deleteModalInstance = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    liveToastInstance = new bootstrap.Toast(document.getElementById('liveToast'));

    // 2. Initial Data Loading
    loadDashboardStatistics();
    loadEmployees();

    // 3. Register Event Listeners
    registerEventListeners();
});

/**
 * ===================================================================
 * EVENT LISTENERS REGISTRATION
 * ===================================================================
 */
function registerEventListeners() {
    // Refresh stats button
    $('#btn-refresh-stats').on('click', function () {
        loadDashboardStatistics();
        showToast('Dashboard statistics refreshed', 'info');
    });

    // Open "Add Employee" Modal
    $('#btn-open-add-modal').on('click', function () {
        openAddEmployeeModal();
    });

    // Employee Form Submission (Handles both CREATE and UPDATE)
    $('#employee-form').on('submit', function (e) {
        e.preventDefault();
        saveEmployee();
    });

    // Real-time search with 300ms debounce
    $('#search-input').on('keyup input', function () {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(function () {
            applySearchAndFilters();
        }, 300);
    });

    // Department and Status filter dropdown changes
    $('#filter-department, #filter-status').on('change', function () {
        applySearchAndFilters();
    });

    // Reset filters button
    $('#btn-reset-filters, #btn-empty-reset').on('click', function () {
        resetFilters();
    });

    // Dynamic Table Row Action Buttons (Event Delegation)
    $('#employee-table-body').on('click', '.btn-view', function () {
        const id = $(this).data('id');
        openViewEmployeeModal(id);
    });

    $('#employee-table-body').on('click', '.btn-edit', function () {
        const id = $(this).data('id');
        openEditEmployeeModal(id);
    });

    $('#employee-table-body').on('click', '.btn-delete', function () {
        const id = $(this).data('id');
        const name = $(this).data('name');
        openDeleteConfirmModal(id, name);
    });

    // Confirm Delete Button in Modal
    $('#btn-confirm-delete').on('click', function () {
        executeDeleteEmployee();
    });

    // Clear input validation states when user types
    $('#employee-form input, #employee-form select').on('input change', function () {
        $(this).removeClass('is-invalid');
    });
}

/**
 * ===================================================================
 * 1. DASHBOARD STATISTICS (GET /api/employees/statistics)
 * ===================================================================
 */
function loadDashboardStatistics() {
    $.ajax({
        url: `${API_BASE_URL}/statistics`,
        type: 'GET',
        dataType: 'json',
        success: function (stats) {
            $('#stat-total-employees').text(stats.totalEmployees);
            $('#stat-active-employees').text(stats.activeEmployees);
            $('#stat-inactive-employees').text(stats.inactiveEmployees);
            $('#stat-total-departments').text(stats.totalDepartments);
        },
        error: function (xhr) {
            console.error('Failed to load dashboard statistics:', xhr);
            showToast('Failed to load dashboard statistics', 'danger');
        }
    });
}

/**
 * ===================================================================
 * 2. LOAD EMPLOYEES (GET /api/employees)
 * ===================================================================
 */
function loadEmployees() {
    showLoadingSpinner(true);

    $.ajax({
        url: API_BASE_URL,
        type: 'GET',
        dataType: 'json',
        success: function (employees) {
            renderEmployeeTable(employees);
            showLoadingSpinner(false);
        },
        error: function (xhr) {
            showLoadingSpinner(false);
            console.error('Failed to load employees:', xhr);
            showToast('Unable to connect to server. Please check backend status.', 'danger');
        }
    });
}

/**
 * ===================================================================
 * 3. SEARCH & FILTER CONTROLLER
 * ===================================================================
 */
function applySearchAndFilters() {
    const query = $('#search-input').val().trim();
    const department = $('#filter-department').val();
    const status = $('#filter-status').val();

    showLoadingSpinner(true);

    // If a search query exists, use the search endpoint
    if (query.length > 0) {
        $.ajax({
            url: `${API_BASE_URL}/search?query=${encodeURIComponent(query)}`,
            type: 'GET',
            dataType: 'json',
            success: function (results) {
                // Apply any client-side department/status narrowing if selected alongside search
                let filtered = results;
                if (department) {
                    filtered = filtered.filter(e => e.department === department);
                }
                if (status) {
                    filtered = filtered.filter(e => e.employmentStatus === status);
                }
                renderEmployeeTable(filtered);
                showLoadingSpinner(false);
            },
            error: function () {
                showLoadingSpinner(false);
                showToast('Error executing search query', 'danger');
            }
        });
    } else if (department || status) {
        // Use the filter endpoint
        let filterUrl = `${API_BASE_URL}/filter?`;
        const params = [];
        if (department) params.push(`department=${encodeURIComponent(department)}`);
        if (status) params.push(`status=${encodeURIComponent(status)}`);
        filterUrl += params.join('&');

        $.ajax({
            url: filterUrl,
            type: 'GET',
            dataType: 'json',
            success: function (results) {
                renderEmployeeTable(results);
                showLoadingSpinner(false);
            },
            error: function () {
                showLoadingSpinner(false);
                showToast('Error applying filters', 'danger');
            }
        });
    } else {
        // No filters or search query - fetch all
        loadEmployees();
    }
}

function resetFilters() {
    $('#search-input').val('');
    $('#filter-department').val('');
    $('#filter-status').val('');
    loadEmployees();
}

/**
 * ===================================================================
 * 4. RENDER EMPLOYEE TABLE & EMPTY STATES
 * ===================================================================
 */
function renderEmployeeTable(employees) {
    const $tbody = $('#employee-table-body');
    $tbody.empty();

    if (!employees || employees.length === 0) {
        $('#table-container').addClass('d-none');
        $('#empty-state').removeClass('d-none');
        $('#record-count-indicator').text('Showing 0 records');
        return;
    }

    $('#empty-state').addClass('d-none');
    $('#table-container').removeClass('d-none');
    $('#record-count-indicator').text(`Showing ${employees.length} record${employees.length === 1 ? '' : 's'}`);

    employees.forEach(function (emp) {
        const isStatusActive = emp.employmentStatus === 'ACTIVE';
        const badgeClass = isStatusActive ? 'badge-status-active' : 'badge-status-inactive';
        const formattedSalary = Number(emp.salary).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        const rowHtml = `
            <tr>
                <td class="ps-3 fw-semibold text-secondary">${escapeHtml(emp.employeeCode)}</td>
                <td>
                    <div class="fw-bold text-dark">${escapeHtml(emp.fullName)}</div>
                    <div class="small text-muted">${escapeHtml(emp.email)}</div>
                </td>
                <td class="d-none d-md-table-cell">${escapeHtml(emp.department)}</td>
                <td class="d-none d-lg-table-cell text-muted">${escapeHtml(emp.jobTitle)}</td>
                <td class="d-none d-xl-table-cell fw-medium text-dark">${formattedSalary}</td>
                <td class="d-none d-lg-table-cell text-muted small">${escapeHtml(emp.hireDate)}</td>
                <td>
                    <span class="badge ${badgeClass} rounded-pill">${escapeHtml(emp.employmentStatus)}</span>
                </td>
                <td class="text-end pe-3">
                    <div class="action-btn-group">
                        <button type="button" class="btn btn-outline-info btn-view" data-id="${emp.id}" title="View Details">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button type="button" class="btn btn-outline-primary btn-edit" data-id="${emp.id}" title="Edit Employee">
                            <i class="bi bi-pencil-square"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger btn-delete" data-id="${emp.id}" data-name="${escapeHtml(emp.fullName)}" title="Delete Employee">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        $tbody.append(rowHtml);
    });
}

/**
 * ===================================================================
 * 5. ADD / CREATE EMPLOYEE MODAL (POST /api/employees)
 * ===================================================================
 */
function openAddEmployeeModal() {
    clearFormErrors();
    $('#employee-form')[0].reset();
    $('#employee-id').val(''); // Clear ID indicates CREATE mode

    $('#modal-title-text').text('Add New Employee');
    $('#modal-icon').attr('class', 'bi bi-person-plus-fill text-primary');
    $('#btn-save-text').text('Save Employee');
    $('#employeeCode').prop('readonly', false);
    $('#modal-alert').addClass('d-none').text('');

    employeeModalInstance.show();
}

/**
 * ===================================================================
 * 6. EDIT / UPDATE EMPLOYEE MODAL (GET & PUT /api/employees/{id})
 * ===================================================================
 */
function openEditEmployeeModal(id) {
    clearFormErrors();
    $('#modal-alert').addClass('d-none').text('');

    // Fetch latest record from server
    $.ajax({
        url: `${API_BASE_URL}/${id}`,
        type: 'GET',
        dataType: 'json',
        success: function (emp) {
            $('#employee-id').val(emp.id);
            $('#employeeCode').val(emp.employeeCode).prop('readonly', false);
            $('#firstName').val(emp.firstName);
            $('#lastName').val(emp.lastName);
            $('#email').val(emp.email);
            $('#phoneNumber').val(emp.phoneNumber);
            $('#department').val(emp.department);
            $('#jobTitle').val(emp.jobTitle);
            $('#salary').val(emp.salary);
            $('#hireDate').val(emp.hireDate);
            $('#employmentStatus').val(emp.employmentStatus);

            $('#modal-title-text').text('Edit Employee');
            $('#modal-icon').attr('class', 'bi bi-pencil-square text-primary');
            $('#btn-save-text').text('Update Changes');

            employeeModalInstance.show();
        },
        error: function (xhr) {
            showToast(getErrorMessage(xhr, 'Failed to fetch employee details'), 'danger');
        }
    });
}

/**
 * ===================================================================
 * 7. SAVE EMPLOYEE (AJAX POST or PUT Dispatcher)
 * ===================================================================
 */
function saveEmployee() {
    clearFormErrors();

    const employeeId = $('#employee-id').val();
    const isUpdate = employeeId && employeeId.trim() !== '';

    // Collect payload from form
    const payload = {
        employeeCode: $('#employeeCode').val().trim(),
        firstName: $('#firstName').val().trim(),
        lastName: $('#lastName').val().trim(),
        email: $('#email').val().trim(),
        phoneNumber: $('#phoneNumber').val().trim(),
        department: $('#department').val(),
        jobTitle: $('#jobTitle').val().trim(),
        salary: $('#salary').val() ? parseFloat($('#salary').val()) : null,
        hireDate: $('#hireDate').val(),
        employmentStatus: $('#employmentStatus').val()
    };

    const url = isUpdate ? `${API_BASE_URL}/${employeeId}` : API_BASE_URL;
    const method = isUpdate ? 'PUT' : 'POST';

    // Show button loading spinner
    setSaveButtonLoading(true);

    $.ajax({
        url: url,
        type: method,
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify(payload),
        dataType: 'json',
        success: function (savedEmployee) {
            setSaveButtonLoading(false);
            employeeModalInstance.hide();
            showToast(isUpdate ? 'Employee updated successfully!' : 'Employee added successfully!', 'success');

            // Refresh UI and dashboard numbers
            loadEmployees();
            loadDashboardStatistics();
        },
        error: function (xhr) {
            setSaveButtonLoading(false);
            handleSaveErrors(xhr);
        }
    });
}

/**
 * Handles validation errors (400), duplicate conflicts (409), and 500s from Spring Boot
 */
function handleSaveErrors(xhr) {
    if (xhr.status === 400 && xhr.responseJSON && xhr.responseJSON.validationErrors) {
        // Map backend Jakarta Bean Validation field errors to specific form input boxes
        const errors = xhr.responseJSON.validationErrors;
        for (const [field, message] of Object.entries(errors)) {
            const $input = $(`#${field}`);
            const $errorDiv = $(`#error-${field}`);
            if ($input.length) {
                $input.addClass('is-invalid');
                $errorDiv.text(message);
            }
        }
    } else if (xhr.status === 409 && xhr.responseJSON) {
        // Display duplicate employee code or email warning in the modal banner
        $('#modal-alert').removeClass('d-none').text(xhr.responseJSON.message);
    } else {
        const errorMsg = getErrorMessage(xhr, 'An unexpected server error occurred.');
        $('#modal-alert').removeClass('d-none').text(errorMsg);
    }
}

/**
 * ===================================================================
 * 8. VIEW EMPLOYEE PROFILE MODAL (GET /api/employees/{id})
 * ===================================================================
 */
function openViewEmployeeModal(id) {
    $.ajax({
        url: `${API_BASE_URL}/${id}`,
        type: 'GET',
        dataType: 'json',
        success: function (emp) {
            $('#view-fullname').text(emp.fullName);
            $('#view-code').text(emp.employeeCode);

            const isStatusActive = emp.employmentStatus === 'ACTIVE';
            $('#view-status')
                .text(emp.employmentStatus)
                .attr('class', `badge ${isStatusActive ? 'bg-success' : 'bg-secondary'} ms-1`);

            $('#view-department').text(emp.department);
            $('#view-jobtitle').text(emp.jobTitle);
            $('#view-email').text(emp.email);
            $('#view-phone').text(emp.phoneNumber);

            const formattedSalary = Number(emp.salary).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            $('#view-salary').text(`LKR ${formattedSalary}`);
            $('#view-hiredate').text(emp.hireDate);
            $('#view-createdat').text(emp.createdAt || 'N/A');
            $('#view-updatedat').text(emp.updatedAt || 'N/A');

            viewModalInstance.show();
        },
        error: function (xhr) {
            showToast(getErrorMessage(xhr, 'Failed to fetch employee details'), 'danger');
        }
    });
}

/**
 * ===================================================================
 * 9. DELETE EMPLOYEE (DELETE /api/employees/{id})
 * ===================================================================
 */
function openDeleteConfirmModal(id, name) {
    $('#delete-employee-id').val(id);
    $('#delete-employee-name').text(name);
    deleteModalInstance.show();
}

function executeDeleteEmployee() {
    const id = $('#delete-employee-id').val();
    if (!id) return;

    setDeleteButtonLoading(true);

    $.ajax({
        url: `${API_BASE_URL}/${id}`,
        type: 'DELETE',
        success: function () {
            setDeleteButtonLoading(false);
            deleteModalInstance.hide();
            showToast('Employee deleted successfully', 'success');

            // Refresh UI and recalculate dashboard counters
            loadEmployees();
            loadDashboardStatistics();
        },
        error: function (xhr) {
            setDeleteButtonLoading(false);
            deleteModalInstance.hide();
            showToast(getErrorMessage(xhr, 'Failed to delete employee'), 'danger');
        }
    });
}

/**
 * ===================================================================
 * 10. UI UTILITIES & HELPERS
 * ===================================================================
 */
function showLoadingSpinner(show) {
    if (show) {
        $('#loading-spinner').removeClass('d-none');
        $('#table-container').addClass('d-none');
        $('#empty-state').addClass('d-none');
    } else {
        $('#loading-spinner').addClass('d-none');
    }
}

function setSaveButtonLoading(isLoading) {
    if (isLoading) {
        $('#btn-save-employee').prop('disabled', true);
        $('#save-spinner').removeClass('d-none');
    } else {
        $('#btn-save-employee').prop('disabled', false);
        $('#save-spinner').addClass('d-none');
    }
}

function setDeleteButtonLoading(isLoading) {
    if (isLoading) {
        $('#btn-confirm-delete').prop('disabled', true);
        $('#delete-spinner').removeClass('d-none');
    } else {
        $('#btn-confirm-delete').prop('disabled', false);
        $('#delete-spinner').addClass('d-none');
    }
}

function clearFormErrors() {
    $('.is-invalid').removeClass('is-invalid');
    $('#modal-alert').addClass('d-none').text('');
}

function showToast(message, type = 'success') {
    const $toast = $('#liveToast');
    const $icon = $('#toast-icon');

    $toast.removeClass('bg-success bg-danger bg-info bg-warning');

    if (type === 'success') {
        $toast.addClass('bg-success');
        $icon.attr('class', 'bi bi-check-circle-fill fs-5');
    } else if (type === 'danger') {
        $toast.addClass('bg-danger');
        $icon.attr('class', 'bi bi-exclamation-triangle-fill fs-5');
    } else if (type === 'info') {
        $toast.addClass('bg-info text-dark');
        $icon.attr('class', 'bi bi-info-circle-fill fs-5');
    }

    $('#toast-message span').text(message);
    liveToastInstance.show();
}

function getErrorMessage(xhr, fallbackMessage) {
    if (xhr.responseJSON && xhr.responseJSON.message) {
        return xhr.responseJSON.message;
    }
    return fallbackMessage;
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}