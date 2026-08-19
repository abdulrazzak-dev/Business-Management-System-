package com.business.management.controller;

import com.business.management.dto.OmniSearchResponse;
import com.business.management.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    @GetMapping
    public ResponseEntity<OmniSearchResponse> search(
            Authentication authentication,
            @RequestParam(required = false, defaultValue = "") String q
    ) {
        return ResponseEntity.ok(searchService.search(authentication, q));
    }
}
