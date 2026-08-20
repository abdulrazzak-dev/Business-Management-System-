package com.business.management.service;

import com.business.management.dto.CreateAdminRequest;
import com.business.management.dto.CreateUserRequest;
import com.business.management.dto.LoginResponse;
import com.business.management.dto.UserProfileUpdateRequest;
import com.business.management.exception.BadRequestException;
import com.business.management.exception.ResourceNotFoundException;
import com.business.management.model.User;
import com.business.management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<LoginResponse.UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(user -> LoginResponse.UserDto.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .role(user.getRole().name())
                        .build())
                .collect(Collectors.toList());
    }

    public LoginResponse.UserDto updateUserProfile(Authentication authentication, UserProfileUpdateRequest request) {
        String currentEmail = authentication.getName();
        User currentUser = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Logged-in user not found"));

        if (!currentUser.getEmail().equalsIgnoreCase(request.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new BadRequestException("Email address is already in use: " + request.getEmail());
            }
            currentUser.setEmail(request.getEmail());
        }

        currentUser.setName(request.getName());

        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            if (request.getPassword().length() < 6) {
                throw new BadRequestException("Password must be at least 6 characters long");
            }
            currentUser.setPassword(passwordEncoder.encode(request.getPassword().trim()));
        }

        currentUser.setUpdatedAt(LocalDateTime.now());
        userRepository.save(currentUser);

        return LoginResponse.UserDto.builder()
                .id(currentUser.getId())
                .name(currentUser.getName())
                .email(currentUser.getEmail())
                .role(currentUser.getRole().name())
                .build();
    }

    public LoginResponse.UserDto createUserAccount(CreateUserRequest request, Authentication authentication) {
        enforceAdminRole(authentication);

        if (userRepository.existsByEmail(request.getEmail().trim())) {
            throw new BadRequestException("Email address is already in use: " + request.getEmail());
        }

        User newUser = User.builder()
                .name(request.getName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword().trim()))
                .role(request.getRole() != null ? request.getRole() : User.Role.STAFF)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        userRepository.save(newUser);

        return LoginResponse.UserDto.builder()
                .id(newUser.getId())
                .name(newUser.getName())
                .email(newUser.getEmail())
                .role(newUser.getRole().name())
                .build();
    }

    public LoginResponse.UserDto createAdminAccount(CreateAdminRequest request) {
        if (userRepository.existsByEmail(request.getEmail().trim())) {
            throw new BadRequestException("Email address is already in use: " + request.getEmail());
        }

        User newAdmin = User.builder()
                .name(request.getName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword().trim()))
                .role(User.Role.ADMIN)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        userRepository.save(newAdmin);

        return LoginResponse.UserDto.builder()
                .id(newAdmin.getId())
                .name(newAdmin.getName())
                .email(newAdmin.getEmail())
                .role(newAdmin.getRole().name())
                .build();
    }

    public void deleteUser(Long id, Authentication authentication) {
        enforceAdminRole(authentication);

        User currentUser = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));

        if (currentUser.getId().equals(id)) {
            throw new BadRequestException("You cannot delete your own active administrator profile");
        }

        User userToDelete = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        userRepository.delete(userToDelete);
    }

    private void enforceAdminRole(Authentication authentication) {
        if (authentication == null) {
            throw new org.springframework.security.access.AccessDeniedException("Authentication required");
        }

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin) {
            throw new org.springframework.security.access.AccessDeniedException("Only Administrators are permitted to perform this operation");
        }
    }
}
