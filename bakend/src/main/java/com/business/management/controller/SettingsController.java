package com.business.management.controller;

import com.business.management.model.BusinessSettings;
import com.business.management.service.SettingsService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final SettingsService settingsService;

    @GetMapping
    public ResponseEntity<BusinessSettings> getSettings() {
        return ResponseEntity.ok(settingsService.getSettings());
    }

    @PutMapping
    public ResponseEntity<BusinessSettings> updateSettings(@RequestBody BusinessSettings request) {
        return ResponseEntity.ok(settingsService.updateSettings(request));
    }
}
