package com.business.management.controller;

import com.business.management.service.ReportService;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/revenue-summary")
    public ResponseEntity<ReportService.RevenueSummaryResponse> getRevenueSummary(
            Authentication authentication,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return ResponseEntity.ok(reportService.getRevenueSummary(authentication, startDate, endDate));
    }

    @GetMapping("/daily")
    public ResponseEntity<Map<String, Object>> getDailyReport(Authentication authentication) {
        return ResponseEntity.ok(reportService.getDailyReport(authentication));
    }

    @GetMapping("/weekly")
    public ResponseEntity<Map<String, Object>> getWeeklyReport(Authentication authentication) {
        return ResponseEntity.ok(reportService.getWeeklyReport(authentication));
    }

    @GetMapping("/monthly")
    public ResponseEntity<Map<String, Object>> getMonthlyReport(Authentication authentication) {
        return ResponseEntity.ok(reportService.getMonthlyReport(authentication));
    }

    @GetMapping("/top-products")
    public ResponseEntity<List<Map<String, Object>>> getTopProducts(Authentication authentication) {
        return ResponseEntity.ok(reportService.getTopProducts(authentication));
    }
}
