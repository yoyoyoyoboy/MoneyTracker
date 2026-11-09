package com.moneytrack.moneytrack.dto;

import java.time.Instant;

public record ExpenseTrackerResponse(Long id, String title, String description, String currency, Integer amount, Instant createdAt) {
}
