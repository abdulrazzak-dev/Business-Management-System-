package com.business.management.repository;

import com.business.management.model.Order;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends MongoRepository<Order, String> {
    List<Order> findByCustomerId(String customerId);
    List<Order> findByStatus(Order.OrderStatus status);
    List<Order> findByOrderNumberContainingIgnoreCaseOrCustomerNameContainingIgnoreCase(String orderNumber, String customerName);
    List<Order> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    List<Order> findTop5ByOrderByCreatedAtDesc();
}
