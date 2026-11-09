package com.moneytrack.moneytrack.dto;

public record ExpenseTrackerRequest (
    String title,
    String description,
    String currency,
    Integer amount
) {

}
