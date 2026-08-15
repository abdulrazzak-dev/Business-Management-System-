package com.business.management.controller;

import com.business.management.model.Product;
import com.business.management.service.InventoryService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping
    public ResponseEntity<List<Product>> getInventory() {
        return ResponseEntity.ok(inventoryService.getInventory());
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<Product>> getLowStock() {
        return ResponseEntity.ok(inventoryService.getLowStock());
    }

    @GetMapping("/out-of-stock")
    public ResponseEntity<List<Product>> getOutOfStock() {
        return ResponseEntity.ok(inventoryService.getOutOfStock());
    }

    @PatchMapping("/{productId}")
    public ResponseEntity<Product> updateStock(@PathVariable String productId, @RequestBody Map<String, Object> body) {
        Integer stockChange = Integer.parseInt(body.getOrDefault("stockChange", "0").toString());
        String actionType = body.getOrDefault("actionType", "add").toString();
        return ResponseEntity.ok(inventoryService.updateStock(productId, stockChange, actionType));
    }
}
