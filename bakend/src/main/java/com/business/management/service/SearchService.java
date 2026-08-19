package com.business.management.service;

import com.business.management.dto.OmniSearchResponse;
import com.business.management.model.Customer;
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

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;

    public OmniSearchResponse search(Authentication authentication, String query) {
        if (query == null || query.trim().isEmpty()) {
            return OmniSearchResponse.builder()
                    .products(new ArrayList<>())
                    .orders(new ArrayList<>())
                    .customers(new ArrayList<>())
                    .inventory(new ArrayList<>())
                    .activity(new ArrayList<>())
                    .build();
        }

        String q = query.trim().toLowerCase();

        String email = authentication != null ? authentication.getName() : null;
        User user = email != null ? userRepository.findByEmail(email).orElse(null) : null;
        boolean isAdmin = user == null || user.getRole() == User.Role.ADMIN;
        String userId = user != null ? user.getId() : null;

        // Products (Full read access for both Staff & Admin)
        List<Product> matchedProducts = productRepository.findAll().stream()
                .filter(p -> (p.getName() != null && p.getName().toLowerCase().contains(q)) ||
                             (p.getSku() != null && p.getSku().toLowerCase().contains(q)) ||
                             (p.getCategory() != null && p.getCategory().toLowerCase().contains(q)))
                .limit(5)
                .collect(Collectors.toList());

        List<OmniSearchResponse.SearchResultItem> productItems = matchedProducts.stream()
                .map(p -> OmniSearchResponse.SearchResultItem.builder()
                        .id(p.getId())
                        .title(p.getName())
                        .subtitle("SKU: " + (p.getSku() != null ? p.getSku() : p.getId()) + " | " + p.getCategory())
                        .details("Rs. " + (p.getPrice() != null ? p.getPrice() : "0.00"))
                        .status((p.getStockQuantity() != null && p.getStockQuantity() <= 10) ? "LOW STOCK" : "IN STOCK")
                        .badge("Products")
                        .url("products.html")
                        .build())
                .collect(Collectors.toList());

        // Inventory (Full read access for both Staff & Admin)
        List<OmniSearchResponse.SearchResultItem> inventoryItems = matchedProducts.stream()
                .map(p -> OmniSearchResponse.SearchResultItem.builder()
                        .id(p.getId())
                        .title(p.getName())
                        .subtitle("SKU: " + (p.getSku() != null ? p.getSku() : p.getId()))
                        .details(p.getStockQuantity() + " units remaining")
                        .status(p.getStatus() != null ? p.getStatus().name() : "IN_STOCK")
                        .badge("Inventory")
                        .url("inventory.html")
                        .build())
                .collect(Collectors.toList());

        // Orders (Scoped by staffId for Staff, Global for Admin)
        List<Order> allOrders = isAdmin ? orderRepository.findAll() : orderRepository.findByStaffId(userId);
        List<Order> matchedOrders = allOrders.stream()
                .filter(o -> (o.getOrderNumber() != null && o.getOrderNumber().toLowerCase().contains(q)) ||
                             (o.getCustomerName() != null && o.getCustomerName().toLowerCase().contains(q)))
                .limit(5)
                .collect(Collectors.toList());

        List<OmniSearchResponse.SearchResultItem> orderItems = matchedOrders.stream()
                .map(o -> OmniSearchResponse.SearchResultItem.builder()
                        .id(o.getId())
                        .title("Order #" + (o.getOrderNumber() != null ? o.getOrderNumber() : o.getId()))
                        .subtitle("Customer: " + (o.getCustomerName() != null ? o.getCustomerName() : "Walk-in Customer"))
                        .details("Rs. " + (o.getTotalAmount() != null ? o.getTotalAmount() : "0.00"))
                        .status(o.getStatus() != null ? o.getStatus().name() : "COMPLETED")
                        .badge("Orders")
                        .url("orders.html")
                        .build())
                .collect(Collectors.toList());

        // Customers (Scoped by staffId for Staff if set, Global for Admin)
        List<Customer> allCustomers = customerRepository.findAll();
        if (!isAdmin && userId != null) {
            allCustomers = allCustomers.stream()
                    .filter(c -> c.getStaffId() == null || c.getStaffId().equals(userId))
                    .collect(Collectors.toList());
        }
        List<Customer> matchedCustomers = allCustomers.stream()
                .filter(c -> (c.getName() != null && c.getName().toLowerCase().contains(q)) ||
                             (c.getEmail() != null && c.getEmail().toLowerCase().contains(q)) ||
                             (c.getPhone() != null && c.getPhone().toLowerCase().contains(q)))
                .limit(5)
                .collect(Collectors.toList());

        List<OmniSearchResponse.SearchResultItem> customerItems = matchedCustomers.stream()
                .map(c -> OmniSearchResponse.SearchResultItem.builder()
                        .id(c.getId())
                        .title(c.getName())
                        .subtitle("Email: " + (c.getEmail() != null ? c.getEmail() : "N/A"))
                        .details(c.getPhone() != null ? c.getPhone() : "")
                        .status((c.getOrdersCount() != null ? c.getOrdersCount() : 0) + " Orders")
                        .badge("Customers")
                        .url("customers.html")
                        .build())
                .collect(Collectors.toList());

        // Activity (Derived from matched orders & staff activity)
        List<OmniSearchResponse.SearchResultItem> activityItems = matchedOrders.stream()
                .map(o -> OmniSearchResponse.SearchResultItem.builder()
                        .id(o.getId())
                        .title("Order Created: #" + (o.getOrderNumber() != null ? o.getOrderNumber() : o.getId()))
                        .subtitle("Staff: " + (o.getStaffName() != null ? o.getStaffName() : "System"))
                        .details("For: " + (o.getCustomerName() != null ? o.getCustomerName() : "Customer"))
                        .status(o.getStatus() != null ? o.getStatus().name() : "COMPLETED")
                        .badge("Activity")
                        .url("dashboard.html")
                        .build())
                .collect(Collectors.toList());

        return OmniSearchResponse.builder()
                .products(productItems)
                .orders(orderItems)
                .customers(customerItems)
                .inventory(inventoryItems)
                .activity(activityItems)
                .build();
    }
}
