package com.business.management.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "business_settings")
public class BusinessSettings {

    @Id
    private String id;
    private String businessName;
    private String businessEmail;
    private String phone;
    private String address;
    private String currency;
    private BigDecimal taxRate;
    private String theme;
    private Boolean notificationsEnabled;
    private LocalDateTime updatedAt;
}
