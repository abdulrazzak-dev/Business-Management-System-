package com.business.management.dto;

import com.business.management.model.Order;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {

    private BigDecimal totalSales;
    private Long totalOrders;
    private Long totalProducts;
    private Long totalCustomers;
    private Long lowStockProducts;
    private List<Order> recentOrders;
    private List<Order> recentTransactions;
    private SalesOverviewDto salesOverview;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SalesOverviewDto {
        private List<String> labels;
        private List<BigDecimal> revenueData;
        private List<Integer> ordersData;
    }
}
