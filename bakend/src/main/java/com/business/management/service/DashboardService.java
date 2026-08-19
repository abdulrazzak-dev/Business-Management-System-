package com.business.management.service;

import com.business.management.dto.DashboardResponse;
import com.business.management.model.Order;
import com.business.management.model.Product;
import com.business.management.model.User;
import com.business.management.repository.CustomerRepository;
import com.business.management.repository.OrderRepository;
import com.business.management.repository.ProductRepository;
import com.business.management.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
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
    private final UserRepository userRepository;

    public DashboardResponse getDashboardData(Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        User user = email != null ? userRepository.findByEmail(email).orElse(null) : null;
        boolean isAdmin = user == null || user.getRole() == User.Role.ADMIN;
        String userId = user != null ? user.getId() : null;

        List<Order> orders;
        List<Order> recentOrders;
        long totalCustomersCount;

        if (isAdmin) {
            orders = orderRepository.findAll();
            recentOrders = orderRepository.findTop5ByOrderByCreatedAtDesc();
            totalCustomersCount = customerRepository.count();
        } else {
            orders = orderRepository.findByStaffId(userId);
            recentOrders = orderRepository.findTop5ByStaffIdOrderByCreatedAtDesc(userId);
            totalCustomersCount = customerRepository.countByStaffId(userId);
        }

        BigDecimal totalSales = orders.stream()
                .filter(o -> o.getStatus() == Order.OrderStatus.COMPLETED || o.getStatus() == Order.OrderStatus.PROCESSING)
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalOrdersCount = orders.size();
        long totalProductsCount = productRepository.count();
        long lowStockCount = productRepository.findByStatus(Product.ProductStatus.LOW_STOCK).size();

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
                .recentOrders(isAdmin ? recentOrders : null)
                .recentTransactions(recentOrders)
                .salesOverview(salesOverview)
                .build();
    }
}
