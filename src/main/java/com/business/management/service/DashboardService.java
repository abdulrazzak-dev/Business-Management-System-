package com.business.management.service;

import com.business.management.dto.DashboardResponse;
import com.business.management.model.Order;
import com.business.management.model.Product;
import com.business.management.repository.CustomerRepository;
import com.business.management.repository.OrderRepository;
import com.business.management.repository.ProductRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;

    public DashboardResponse getDashboardData() {
        List<Order> allOrders = orderRepository.findAll();
        
        BigDecimal totalSales = allOrders.stream()
                .filter(o -> o.getStatus() == Order.OrderStatus.COMPLETED || o.getStatus() == Order.OrderStatus.PROCESSING)
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalOrdersCount = allOrders.size();
        long totalProductsCount = productRepository.count();
        long totalCustomersCount = customerRepository.count();
        long lowStockCount = productRepository.findByStatus(Product.ProductStatus.LOW_STOCK).size();

        List<Order> recentOrders = orderRepository.findTop5ByOrderByCreatedAtDesc();

        DashboardResponse.SalesOverviewDto salesOverview = DashboardResponse.SalesOverviewDto.builder()
                .labels(Arrays.asList("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"))
                .revenueData(Arrays.asList(
                        new BigDecimal("1200"), new BigDecimal("1900"), new BigDecimal("1500"),
                        new BigDecimal("2400"), new BigDecimal("2800"), new BigDecimal("3200"), new BigDecimal("2900")
                ))
                .ordersData(Arrays.asList(15, 22, 18, 29, 35, 40, 38))
                .build();

        return DashboardResponse.builder()
                .totalSales(totalSales)
                .totalOrders(totalOrdersCount)
                .totalProducts(totalProductsCount)
                .totalCustomers(totalCustomersCount)
                .lowStockProducts(lowStockCount)
                .recentOrders(recentOrders)
                .recentTransactions(recentOrders)
                .salesOverview(salesOverview)
                .build();
    }
}
