package com.example.sable;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main entry point for the SABLE Spring Boot application.
 *
 * @SpringBootApplication is a convenience annotation that combines:
 * - @Configuration: Marks this class as a source of bean definitions.
 * - @EnableAutoConfiguration: Enables Spring Boot's auto-configuration (e.g. DataSource, JPA, Web).
 * - @ComponentScan: Scans the package com.example.sable and all sub-packages for
 *   @Component, @Service, @Repository, @Controller, etc., and registers them as beans.
 *
 * Component scanning ensures that TransactionController, TransactionService,
 * TransactionRepository, and GlobalExceptionHandler are discovered and wired automatically.
 */
@SpringBootApplication
public class SableApplication {

    public static void main(String[] args) {
        SpringApplication.run(SableApplication.class, args);
    }
}
