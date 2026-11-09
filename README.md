# Employee Management System (EMS)

[![Java 17](https://img.shields.io/badge/Java-17-orange.svg?logo=openjdk)](https://openjdk.org/projects/jdk/17/)
[![Spring Boot 3.3.x](https://img.shields.io/badge/Spring_Boot-3.3.x-brightgreen.svg?logo=springboot)](https://spring.io/projects/spring-boot)
[![MySQL 8.0](https://img.shields.io/badge/MySQL-8.0-blue.svg?logo=mysql)](https://www.mysql.com/)
[![Bootstrap 5.3](https://img.shields.io/badge/Bootstrap-5.3-purple.svg?logo=bootstrap)](https://getbootstrap.com/)
[![jQuery 3.7.1](https://img.shields.io/badge/jQuery-3.7.1-blueviolet.svg?logo=jquery)](https://jquery.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A full-stack, enterprise-grade Employee Management System built with **Java 17**, **Spring Boot 3**, **Spring Data JPA**, **MySQL 8**, **Bootstrap 5**, and a **jQuery AJAX** single-page frontend. Designed with a clean, decoupled layered architecture, strict data validation, centralized exception handling, and full responsiveness across mobile, tablet, and desktop viewports.

---

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Database Schema](#database-schema)
- [REST API Documentation](#rest-api-documentation)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Database Setup](#database-setup)
  - [Configuration](#configuration)
  - [Building and Running](#building-and-running)
- [Frontend User Interface](#frontend-user-interface)
- [Responsive Viewport Testing](#responsive-viewport-testing)
- [Architectural & Design Decisions](#architectural--design-decisions)
- [Author](#author)

---

## Architecture Overview

The system strictly follows a decoupled, layered Spring Boot architectural pattern:

```text
[ Browser / Client ] (HTML5, Bootstrap 5, jQuery 3.7.1 AJAX)
         │
         ▼  HTTP / REST JSON (/api/employees/**)
[ Controller Layer ] (EmployeeController - Thin Request/Response Dispatcher)
         │  DTOs (EmployeeRequestDTO, EmployeeResponseDTO, DashboardStatsDTO)
         ▼
[ Service Layer ]    (EmployeeService - Business Rules, Validation, Transactions)
         │  Domain Entities (Employee)
         ▼
[ Repository Layer ] (EmployeeRepository - Spring Data JPA, Derived & JPQL Queries)
         │  Hibernate 6 ORM
         ▼
[ Database Layer ]   (MySQL 8.0 Relational Engine)
         ▲
         │ (Aspect-Oriented Exception Interception)
[ Advice Layer ]     (GlobalExceptionHandler - RFC 7807 Standardized Error Envelopes)