package com.business.management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OmniSearchResponse {
    private List<SearchResultItem> products;
    private List<SearchResultItem> orders;
    private List<SearchResultItem> customers;
    private List<SearchResultItem> inventory;
    private List<SearchResultItem> activity;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SearchResultItem {
        private String id;
        private String title;
        private String subtitle;
        private String details;
        private String status;
        private String badge;
        private String url;
    }
}
