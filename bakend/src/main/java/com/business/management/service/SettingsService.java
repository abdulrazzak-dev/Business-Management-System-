package com.business.management.service;

import com.business.management.model.BusinessSettings;
import com.business.management.repository.BusinessSettingsRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SettingsService {

    private final BusinessSettingsRepository settingsRepository;

    public BusinessSettings getSettings() {
        return settingsRepository.findAll().stream()
                .findFirst()
                .orElseGet(this::createDefaultSettings);
    }

    public BusinessSettings updateSettings(BusinessSettings request) {
        BusinessSettings settings = getSettings();

        settings.setBusinessName(request.getBusinessName());
        settings.setBusinessEmail(request.getBusinessEmail());
        settings.setPhone(request.getPhone());
        settings.setAddress(request.getAddress());
        settings.setCurrency(request.getCurrency());
        settings.setTaxRate(request.getTaxRate());
        settings.setTheme(request.getTheme());
        settings.setNotificationsEnabled(request.getNotificationsEnabled());
        settings.setUpdatedAt(LocalDateTime.now());

        return settingsRepository.save(settings);
    }

    private BusinessSettings createDefaultSettings() {
        BusinessSettings defaults = BusinessSettings.builder()
                .businessName("Apex Tech & Retail Solutions")
                .businessEmail("contact@apextech.com")
                .phone("+1 (555) 234-5678")
                .address("742 Evergreen Terrace, Suite 400, San Francisco, CA")
                .currency("USD")
                .taxRate(new BigDecimal("8.5"))
                .theme("light")
                .notificationsEnabled(true)
                .updatedAt(LocalDateTime.now())
                .build();

        return settingsRepository.save(defaults);
    }
}
