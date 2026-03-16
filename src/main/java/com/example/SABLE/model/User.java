package com.example.SABLE.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Unique username
    @Column(unique = true, nullable = false)
    private String username;

    // Encrypted password
    @Column(nullable = false)
    private String password;

    // Role of user
    @Enumerated(EnumType.STRING)
    private Role role;
}
