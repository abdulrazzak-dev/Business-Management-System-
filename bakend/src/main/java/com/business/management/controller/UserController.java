package com.business.management.controller;

import com.business.management.dto.CreateAdminRequest;
import com.business.management.dto.CreateUserRequest;
import com.business.management.dto.LoginResponse;
import com.business.management.dto.UserProfileUpdateRequest;
import com.business.management.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<LoginResponse.UserDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PutMapping("/profile")
    public ResponseEntity<LoginResponse.UserDto> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UserProfileUpdateRequest request
    ) {
        return ResponseEntity.ok(userService.updateUserProfile(authentication, request));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LoginResponse.UserDto> createUser(
            Authentication authentication,
            @Valid @RequestBody CreateUserRequest request
    ) {
        return ResponseEntity.ok(userService.createUserAccount(request, authentication));
    }

    @PostMapping("/create-admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LoginResponse.UserDto> createAdmin(@Valid @RequestBody CreateAdminRequest request) {
        return ResponseEntity.ok(userService.createAdminAccount(request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(
            @PathVariable Long id,
            Authentication authentication
    ) {
        userService.deleteUser(id, authentication);
        return ResponseEntity.noContent().build();
    }
}
