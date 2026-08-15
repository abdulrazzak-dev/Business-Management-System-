package com.business.management.service;

import com.business.management.dto.ProductRequest;
import com.business.management.exception.ResourceNotFoundException;
import com.business.management.model.Product;
import com.business.management.repository.ProductRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    public List<Product> getAllProducts(String search, String category, String status) {
        if (search != null && !search.trim().isEmpty() && category != null && !category.trim().isEmpty()) {
            return productRepository.findByNameContainingIgnoreCaseAndCategoryIgnoreCase(search.trim(), category.trim());
        }
        if (search != null && !search.trim().isEmpty()) {
            return productRepository.findByNameContainingIgnoreCase(search.trim());
        }
        if (category != null && !category.trim().isEmpty()) {
            return productRepository.findByCategoryIgnoreCase(category.trim());
        }
        if (status != null && !status.trim().isEmpty()) {
            try {
                Product.ProductStatus productStatus = Product.ProductStatus.valueOf(status.toUpperCase());
                return productRepository.findByStatus(productStatus);
            } catch (IllegalArgumentException ignored) {}
        }
        return productRepository.findAll();
    }

    public Product getProductById(String id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
    }

    public Product createProduct(ProductRequest request) {
        Integer stock = request.getStockQuantity() != null ? request.getStockQuantity() : 0;
        Integer minStock = request.getMinimumStockLevel() != null ? request.getMinimumStockLevel() : 10;
        
        Product.ProductStatus status = determineStatus(stock, minStock);

        Product product = Product.builder()
                .sku(request.getSku() != null ? request.getSku() : "PRD-" + (1000 + (int)(Math.random() * 9000)))
                .name(request.getName())
                .category(request.getCategory())
                .price(request.getPrice())
                .stockQuantity(stock)
                .minimumStockLevel(minStock)
                .status(status)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return productRepository.save(product);
    }

    public Product updateProduct(String id, ProductRequest request) {
        Product product = getProductById(id);

        Integer stock = request.getStockQuantity() != null ? request.getStockQuantity() : product.getStockQuantity();
        Integer minStock = request.getMinimumStockLevel() != null ? request.getMinimumStockLevel() : product.getMinimumStockLevel();

        product.setName(request.getName());
        product.setCategory(request.getCategory());
        product.setPrice(request.getPrice());
        product.setStockQuantity(stock);
        product.setMinimumStockLevel(minStock);
        product.setStatus(determineStatus(stock, minStock));
        product.setUpdatedAt(LocalDateTime.now());

        return productRepository.save(product);
    }

    public void deleteProduct(String id) {
        Product product = getProductById(id);
        productRepository.delete(product);
    }

    public List<Product> getLowStockProducts() {
        return productRepository.findByStatus(Product.ProductStatus.LOW_STOCK);
    }

    public List<Product> getOutOfStockProducts() {
        return productRepository.findByStatus(Product.ProductStatus.OUT_OF_STOCK);
    }

    private Product.ProductStatus determineStatus(int stock, int minStock) {
        if (stock <= 0) return Product.ProductStatus.OUT_OF_STOCK;
        if (stock <= minStock) return Product.ProductStatus.LOW_STOCK;
        return Product.ProductStatus.IN_STOCK;
    }
}
