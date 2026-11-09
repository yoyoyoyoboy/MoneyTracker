package com.moneytrack.moneytrack.dto;

public record ExpenseTrackerResponse(Long id, String title, String description, String currency, Integer amount) {
}
