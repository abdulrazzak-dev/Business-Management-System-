package com.business.management.service;

import com.business.management.dto.CustomerRequest;
import com.business.management.exception.BadRequestException;
import com.business.management.exception.ResourceNotFoundException;
import com.business.management.model.Customer;
import com.business.management.repository.CustomerRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;

    public List<Customer> getAllCustomers(String search) {
        if (search != null && !search.trim().isEmpty()) {
            String q = search.trim();
            return customerRepository.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrPhoneContaining(q, q, q);
        }
        return customerRepository.findAll();
    }

    public Customer getCustomerById(String id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));
    }

    public Customer createCustomer(CustomerRequest request) {
        if (customerRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Customer email already exists: " + request.getEmail());
        }

        Customer customer = Customer.builder()
                .customerCode("CUST-" + (200 + (int)(Math.random() * 800)))
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .address(request.getAddress())
                .totalPurchases(BigDecimal.ZERO)
                .ordersCount(0)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return customerRepository.save(customer);
    }

    public Customer updateCustomer(String id, CustomerRequest request) {
        Customer customer = getCustomerById(id);

        customer.setName(request.getName());
        customer.setEmail(request.getEmail());
        customer.setPhone(request.getPhone());
        customer.setAddress(request.getAddress());
        customer.setUpdatedAt(LocalDateTime.now());

        return customerRepository.save(customer);
    }

    public void deleteCustomer(String id) {
        Customer customer = getCustomerById(id);
        customerRepository.delete(customer);
    }

    public void updateCustomerPurchases(String customerId, BigDecimal orderTotal) {
        if (customerId == null || customerId.trim().isEmpty()) return;
        try {
            Customer customer = getCustomerById(customerId);
            BigDecimal currentTotal = customer.getTotalPurchases() != null ? customer.getTotalPurchases() : BigDecimal.ZERO;
            int currentOrders = customer.getOrdersCount() != null ? customer.getOrdersCount() : 0;

            customer.setTotalPurchases(currentTotal.add(orderTotal));
            customer.setOrdersCount(currentOrders + 1);
            customer.setUpdatedAt(LocalDateTime.now());
            customerRepository.save(customer);
        } catch (Exception ignored) {}
    }
}
