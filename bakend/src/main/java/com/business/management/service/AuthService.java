package com.business.management.service;

import com.business.management.dto.LoginRequest;
import com.business.management.dto.LoginResponse;
import com.business.management.dto.RegisterRequest;
import com.business.management.exception.BadRequestException;
import com.business.management.exception.ResourceNotFoundException;
import com.business.management.model.User;
import com.business.management.repository.UserRepository;
import com.business.management.security.JwtService;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public LoginResponse login(LoginRequest request) {
        if (request.getEmail() == null || request.getEmail().trim().isEmpty() || request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            throw new org.springframework.security.authentication.BadCredentialsException("Invalid email or password");
        }

        String rawEmail = request.getEmail().trim();
        User user = userRepository.findByEmailIgnoreCase(rawEmail)
                .orElseThrow(() -> new org.springframework.security.authentication.BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new org.springframework.security.authentication.BadCredentialsException("Invalid email or password");
        }

        if (request.getRole() != null && !request.getRole().trim().isEmpty()) {
            String selectedRole = request.getRole().trim();
            String userRole = user.getRole() != null ? user.getRole().name() : "STAFF";

            if (!selectedRole.equalsIgnoreCase(userRole)) {
                throw new org.springframework.security.authentication.BadCredentialsException("Role mismatch for this account");
            }
        }

        org.springframework.security.core.userdetails.User userDetails = new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                java.util.Collections.singletonList(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );

        String jwtToken = jwtService.generateToken(userDetails);

        return LoginResponse.builder()
                .token(jwtToken)
                .user(LoginResponse.UserDto.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .role(user.getRole().name())
                        .build())
                .build();
    }

    public LoginResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email address is already in use: " + request.getEmail());
        }

        User newUser = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.STAFF)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        userRepository.save(newUser);

        return login(new LoginRequest() {{
            setEmail(request.getEmail());
            setPassword(request.getPassword());
        }});
    }

    public LoginResponse.UserDto getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User profile not found"));

        return LoginResponse.UserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }
}
