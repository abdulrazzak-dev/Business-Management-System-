package com.business.management.controller;

import com.business.management.dto.CreateAdminRequest;
import com.business.management.dto.CreateUserRequest;
import com.business.management.dto.LoginResponse;
import com.business.management.dto.UserProfileUpdateRequest;
import com.business.management.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(
        origins = "*",
        allowedHeaders = "*",
        methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS}
)
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
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
    public ResponseEntity<LoginResponse.UserDto> createUser(
            Authentication authentication,
            @Valid @RequestBody CreateUserRequest request
    ) {
        return ResponseEntity.ok(userService.createUserAccount(request, authentication));
    }

    @PostMapping("/create-admin")
    public ResponseEntity<LoginResponse.UserDto> createAdmin(@Valid @RequestBody CreateAdminRequest request) {
        return ResponseEntity.ok(userService.createAdminAccount(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(
            @PathVariable String id,
            Authentication authentication
    ) {
        userService.deleteUser(id, authentication);
        return ResponseEntity.noContent().build();
    }
}
