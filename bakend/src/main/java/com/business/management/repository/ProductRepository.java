package com.business.management.repository;

import com.business.management.model.Product;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends MongoRepository<Product, String> {
    List<Product> findByNameContainingIgnoreCase(String name);
    List<Product> findByCategoryIgnoreCase(String category);
    List<Product> findByStatus(Product.ProductStatus status);
    List<Product> findByNameContainingIgnoreCaseAndCategoryIgnoreCase(String name, String category);
    List<Product> findByNameContainingIgnoreCaseAndStatus(String name, Product.ProductStatus status);
    List<Product> findByCategoryIgnoreCaseAndStatus(String category, Product.ProductStatus status);
}
