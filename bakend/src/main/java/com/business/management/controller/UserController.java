package com.business.management.controller;

import com.business.management.dto.CreateAdminRequest;
import com.business.management.dto.LoginResponse;
import com.business.management.dto.UserProfileUpdateRequest;
import com.business.management.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PutMapping("/profile")
    public ResponseEntity<LoginResponse.UserDto> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UserProfileUpdateRequest request
    ) {
        return ResponseEntity.ok(userService.updateUserProfile(authentication, request));
    }

    @PostMapping("/create-admin")
    public ResponseEntity<LoginResponse.UserDto> createAdmin(@Valid @RequestBody CreateAdminRequest request) {
        return ResponseEntity.ok(userService.createAdminAccount(request));
    }
}
