package com.business.management.service;

import com.business.management.dto.OrderRequest;
import com.business.management.exception.BadRequestException;
import com.business.management.exception.ResourceNotFoundException;
import com.business.management.model.Customer;
import com.business.management.model.Order;
import com.business.management.model.OrderItem;
import com.business.management.model.Product;
import com.business.management.repository.CustomerRepository;
import com.business.management.repository.OrderRepository;
import com.business.management.repository.ProductRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final CustomerService customerService;

    public List<Order> getAllOrders(String search, String status) {
        if (search != null && !search.trim().isEmpty()) {
            return orderRepository.findByOrderNumberContainingIgnoreCaseOrCustomerNameContainingIgnoreCase(search.trim(), search.trim());
        }
        if (status != null && !status.trim().isEmpty()) {
            try {
                Order.OrderStatus orderStatus = Order.OrderStatus.valueOf(status.toUpperCase());
                return orderRepository.findByStatus(orderStatus);
            } catch (IllegalArgumentException ignored) {}
        }
        return orderRepository.findAll();
    }

    public Order getOrderById(String id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
    }

    public Order createOrder(OrderRequest request) {
        String customerName = "Walk-in Customer";
        if (request.getCustomerId() != null && !request.getCustomerId().trim().isEmpty()) {
            Customer customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + request.getCustomerId()));
            customerName = customer.getName();
        } else if (request.getCustomerName() != null) {
            customerName = request.getCustomerName();
        }

        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;

        for (OrderRequest.OrderItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + itemReq.getProductId()));

            if (product.getStockQuantity() < itemReq.getQuantity()) {
                throw new BadRequestException("Insufficient stock for product '" + product.getName() + "'. Available: " + product.getStockQuantity());
            }

            BigDecimal itemSubtotal = product.getPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            subtotal = subtotal.add(itemSubtotal);

            orderItems.add(OrderItem.builder()
                    .productId(product.getId())
                    .productName(product.getName())
                    .quantity(itemReq.getQuantity())
                    .price(product.getPrice())
                    .subtotal(itemSubtotal)
                    .build());
        }

        BigDecimal taxRate = new BigDecimal("0.085");
        BigDecimal tax = subtotal.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalAmount = subtotal.add(tax);

        Order.OrderStatus orderStatus = Order.OrderStatus.COMPLETED;
        if (request.getStatus() != null) {
            try {
                orderStatus = Order.OrderStatus.valueOf(request.getStatus().toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }

        Order order = Order.builder()
                .orderNumber("ORD-" + (5000 + (int)(Math.random() * 5000)))
                .customerId(request.getCustomerId())
                .customerName(customerName)
                .staffId(request.getStaffId())
                .staffName(request.getStaffName())
                .items(orderItems)
                .subtotal(subtotal)
                .tax(tax)
                .totalAmount(totalAmount)
                .status(orderStatus)
                .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "Credit Card")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Order savedOrder = orderRepository.save(order);

        // Deduct inventory stock if COMPLETED or PROCESSING
        if (orderStatus == Order.OrderStatus.COMPLETED || orderStatus == Order.OrderStatus.PROCESSING) {
            deductInventoryForOrder(orderItems);
        }

        // Update customer spend total
        if (request.getCustomerId() != null) {
            customerService.updateCustomerPurchases(request.getCustomerId(), totalAmount);
        }

        return savedOrder;
    }

    public Order updateOrderStatus(String id, String status) {
        Order order = getOrderById(id);
        Order.OrderStatus newStatus = Order.OrderStatus.valueOf(status.toUpperCase());

        // Deduct stock if changing to COMPLETED for the first time
        if (newStatus == Order.OrderStatus.COMPLETED && order.getStatus() != Order.OrderStatus.COMPLETED && order.getStatus() != Order.OrderStatus.PROCESSING) {
            deductInventoryForOrder(order.getItems());
        }

        order.setStatus(newStatus);
        order.setUpdatedAt(LocalDateTime.now());
        return orderRepository.save(order);
    }

    public void deleteOrder(String id) {
        Order order = getOrderById(id);
        orderRepository.delete(order);
    }

    private void deductInventoryForOrder(List<OrderItem> items) {
        for (OrderItem item : items) {
            productRepository.findById(item.getProductId()).ifPresent(product -> {
                int newStock = Math.max(0, product.getStockQuantity() - item.getQuantity());
                product.setStockQuantity(newStock);
                
                int minStock = product.getMinimumStockLevel() != null ? product.getMinimumStockLevel() : 10;
                if (newStock <= 0) product.setStatus(Product.ProductStatus.OUT_OF_STOCK);
                else if (newStock <= minStock) product.setStatus(Product.ProductStatus.LOW_STOCK);
                else product.setStatus(Product.ProductStatus.IN_STOCK);

                productRepository.save(product);
            });
        }
    }
}
