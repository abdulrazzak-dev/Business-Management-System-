package com.business.management.config;

import com.business.management.model.*;
import com.business.management.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;
    private final BusinessSettingsRepository settingsRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Seed Admin User
        if (userRepository.count() == 0) {
            User admin = User.builder()
                    .name("Alex Morgan")
                    .email("admin@Golden.com")
                    .password(passwordEncoder.encode("admin123"))
                    .role(User.Role.ADMIN)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            userRepository.save(admin);
            System.out.println(">>> Sample Admin User created: admin@Golden.com / admin123");
        }

        // Seed Products
        if (productRepository.count() == 0) {
            Product p1 = Product.builder().sku("PRD-1001").name("UltraSlim Wireless Keyboard").category("Electronics").price(new BigDecimal("69.99")).stockQuantity(45).minimumStockLevel(10).status(Product.ProductStatus.IN_STOCK).createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).build();
            Product p2 = Product.builder().sku("PRD-1002").name("Ergonomic Optical Mouse").category("Electronics").price(new BigDecimal("29.50")).stockQuantity(8).minimumStockLevel(15).status(Product.ProductStatus.LOW_STOCK).createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).build();
            Product p3 = Product.builder().sku("PRD-1003").name("4K Ultra HD Monitor 27\"").category("Electronics").price(new BigDecimal("349.00")).stockQuantity(12).minimumStockLevel(5).status(Product.ProductStatus.IN_STOCK).createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).build();
            Product p4 = Product.builder().sku("PRD-1004").name("Leather Executive Chair").category("Furniture").price(new BigDecimal("249.99")).stockQuantity(0).minimumStockLevel(5).status(Product.ProductStatus.OUT_OF_STOCK).createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).build();
            Product p5 = Product.builder().sku("PRD-1005").name("Standing Desk Converter").category("Furniture").price(new BigDecimal("189.50")).stockQuantity(18).minimumStockLevel(8).status(Product.ProductStatus.IN_STOCK).createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).build();
            Product p6 = Product.builder().sku("PRD-1006").name("Noise-Canceling Headphones").category("Audio").price(new BigDecimal("199.00")).stockQuantity(5).minimumStockLevel(10).status(Product.ProductStatus.LOW_STOCK).createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).build();
            Product p7 = Product.builder().sku("PRD-1007").name("USB-C Multi-Port Hub").category("Accessories").price(new BigDecimal("42.00")).stockQuantity(60).minimumStockLevel(20).status(Product.ProductStatus.IN_STOCK).createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).build();
            Product p8 = Product.builder().sku("PRD-1008").name("HD Webcam with Mic").category("Electronics").price(new BigDecimal("79.95")).stockQuantity(2).minimumStockLevel(10).status(Product.ProductStatus.LOW_STOCK).createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).build();

            productRepository.saveAll(Arrays.asList(p1, p2, p3, p4, p5, p6, p7, p8));
            System.out.println(">>> Sample Products seeded into MongoDB.");
        }

        // Seed Customers
        if (customerRepository.count() == 0) {
            Customer c1 = Customer.builder().customerCode("CUST-201").name("Sarah Jenkins").email("sarah.j@example.com").phone("+1 (555) 891-2345").address("123 Pine Street, Seattle, WA").totalPurchases(new BigDecimal("1240.50")).ordersCount(5).createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).build();
            Customer c2 = Customer.builder().customerCode("CUST-202").name("Michael Chang").email("mchang@techcorp.io").phone("+1 (555) 432-8765").address("88 Tech Boulevard, Austin, TX").totalPurchases(new BigDecimal("3490.00")).ordersCount(8).createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).build();
            Customer c3 = Customer.builder().customerCode("CUST-203").name("Elena Rostova").email("elena.rostova@designlab.com").phone("+1 (555) 901-3412").address("54 Creative Way, New York, NY").totalPurchases(new BigDecimal("620.00")).ordersCount(2).createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).build();

            customerRepository.saveAll(Arrays.asList(c1, c2, c3));
            System.out.println(">>> Sample Customers seeded into MongoDB.");
        }

        // Seed Orders
        if (orderRepository.count() == 0) {
            OrderItem item1 = OrderItem.builder().productId("PRD-1003").productName("4K Ultra HD Monitor 27\"").quantity(2).price(new BigDecimal("349.00")).subtotal(new BigDecimal("698.00")).build();
            Order o1 = Order.builder().orderNumber("ORD-5001").customerName("Michael Chang").customerId("CUST-202").items(Collections.singletonList(item1)).subtotal(new BigDecimal("698.00")).tax(new BigDecimal("59.33")).totalAmount(new BigDecimal("757.33")).status(Order.OrderStatus.COMPLETED).paymentMethod("Credit Card").createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).build();

            orderRepository.save(o1);
            System.out.println(">>> Sample Orders seeded into MongoDB.");
        }

        // Seed Business Settings
        if (settingsRepository.count() == 0) {
            BusinessSettings settings = BusinessSettings.builder()
                    .businessName("Apex Tech & Retail Solutions")
                    .businessEmail("contact@apextech.com")
                    .phone("+1 (555) 234-5678")
                    .address("742 Evergreen Terrace, Suite 400, San Francisco, CA")
                    .currency("USD")
                    .taxRate(new BigDecimal("8.5"))
                    .theme("light")
                    .notificationsEnabled(true)
                    .updatedAt(LocalDateTime.now())
                    .build();
            settingsRepository.save(settings);
            System.out.println(">>> Default Business Settings seeded into MongoDB.");
        }
    }
}
