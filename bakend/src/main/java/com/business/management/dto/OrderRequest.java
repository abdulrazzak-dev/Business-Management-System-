package com.business.management.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import lombok.Data;

import java.util.List;

@Data
public class OrderRequest {

    private String customerId;
    private String customerName;
    private String staffId;
    private String staffName;

    @NotEmpty(message = "Order must contain at least one item")
    @Valid
    private List<OrderItemRequest> items;

    private String paymentMethod;
    private String status;

    @Data
    public static class OrderItemRequest {
        private String productId;
        private String productName;

        @NotNull(message = "Quantity is required")
        @Positive(message = "Quantity must be greater than zero")
        private Integer quantity;

        private BigDecimal price;
    }
}
