package com.business.management.service;

import com.business.management.model.Product;
import com.business.management.repository.ProductRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final ProductRepository productRepository;

    public List<Product> getInventory() {
        return productRepository.findAll();
    }

    public List<Product> getLowStock() {
        return productRepository.findByStatus(Product.ProductStatus.LOW_STOCK);
    }

    public List<Product> getOutOfStock() {
        return productRepository.findByStatus(Product.ProductStatus.OUT_OF_STOCK);
    }

    public Product updateStock(String productId, Integer stockChange, String actionType) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new com.business.management.exception.ResourceNotFoundException("Product not found with id: " + productId));

        int currentStock = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
        int newStock = currentStock;

        if ("add".equalsIgnoreCase(actionType)) {
            newStock = currentStock + stockChange;
        } else if ("remove".equalsIgnoreCase(actionType)) {
            newStock = Math.max(0, currentStock - stockChange);
        } else if ("set".equalsIgnoreCase(actionType)) {
            newStock = Math.max(0, stockChange);
        }

        product.setStockQuantity(newStock);
        int minStock = product.getMinimumStockLevel() != null ? product.getMinimumStockLevel() : 10;
        
        if (newStock <= 0) product.setStatus(Product.ProductStatus.OUT_OF_STOCK);
        else if (newStock <= minStock) product.setStatus(Product.ProductStatus.LOW_STOCK);
        else product.setStatus(Product.ProductStatus.IN_STOCK);

        return productRepository.save(product);
    }
}
