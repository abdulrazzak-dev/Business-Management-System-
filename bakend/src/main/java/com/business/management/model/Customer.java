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
@Document(collection = "customers")
public class Customer {

    @Id
    private String id;
    private String customerCode;
    private String name;
    private String email;
    private String phone;
    private String address;
    private String staffId;
    private BigDecimal totalPurchases;
    private Integer ordersCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
