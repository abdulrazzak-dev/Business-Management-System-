package com.business.management.service;

import com.business.management.model.Order;
import com.business.management.repository.OrderRepository;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final OrderRepository orderRepository;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RevenueSummaryResponse {
        private BigDecimal dailyRevenue;
        private BigDecimal totalRevenue;
        private BigDecimal averageOrderValue;
        private long totalOrders;
    }

    public RevenueSummaryResponse getRevenueSummary(LocalDate startDate, LocalDate endDate) {
        List<Order> orders;
        if (startDate != null && endDate != null) {
            LocalDateTime start = startDate.atStartOfDay();
            LocalDateTime end = endDate.atTime(LocalTime.MAX);
            orders = orderRepository.findByCreatedAtBetween(start, end);
        } else {
            orders = orderRepository.findAll();
        }

        BigDecimal totalRevenue = orders.stream()
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalOrders = orders.size();
        BigDecimal avgOrderValue = totalOrders > 0 
                ? totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        LocalDate today = LocalDate.now();
        BigDecimal dailyRevenue = orders.stream()
                .filter(o -> o.getCreatedAt() != null && o.getCreatedAt().toLocalDate().isEqual(today))
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return RevenueSummaryResponse.builder()
                .dailyRevenue(dailyRevenue)
                .totalRevenue(totalRevenue)
                .averageOrderValue(avgOrderValue)
                .totalOrders(totalOrders)
                .build();
    }

    public Map<String, Object> getDailyReport() {
        Map<String, Object> res = new HashMap<>();
        res.put("labels", Arrays.asList("8 AM", "10 AM", "12 PM", "2 PM", "4 PM", "6 PM", "8 PM"));
        res.put("data", Arrays.asList(240, 480, 890, 650, 1100, 1420, 780));
        return res;
    }

    public Map<String, Object> getWeeklyReport() {
        Map<String, Object> res = new HashMap<>();
        res.put("labels", Arrays.asList("Week 1", "Week 2", "Week 3", "Week 4"));
        res.put("data", Arrays.asList(4200, 5800, 6100, 7400));
        return res;
    }

    public Map<String, Object> getMonthlyReport() {
        Map<String, Object> res = new HashMap<>();
        res.put("labels", Arrays.asList("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"));
        res.put("data", Arrays.asList(18400, 21500, 19800, 24600, 28900, 31200, 29500, 34100));
        return res;
    }

    public List<Map<String, Object>> getTopProducts() {
        List<Map<String, Object>> list = new ArrayList<>();
        
        Map<String, Object> p1 = new HashMap<>();
        p1.put("name", "4K Ultra HD Monitor 27\"");
        p1.put("category", "Electronics");
        p1.put("sold", 48);
        p1.put("revenue", 16752.00);
        list.add(p1);

        Map<String, Object> p2 = new HashMap<>();
        p2.put("name", "Standing Desk Converter");
        p2.put("category", "Furniture");
        p2.put("sold", 34);
        p2.put("revenue", 6443.00);
        list.add(p2);

        Map<String, Object> p3 = new HashMap<>();
        p3.put("name", "UltraSlim Wireless Keyboard");
        p3.put("category", "Electronics");
        p3.put("sold", 62);
        p3.put("revenue", 4339.38);
        list.add(p3);

        Map<String, Object> p4 = new HashMap<>();
        p4.put("name", "Noise-Canceling Headphones");
        p4.put("category", "Audio");
        p4.put("sold", 19);
        p4.put("revenue", 3781.00);
        list.add(p4);

        return list;
    }
}
