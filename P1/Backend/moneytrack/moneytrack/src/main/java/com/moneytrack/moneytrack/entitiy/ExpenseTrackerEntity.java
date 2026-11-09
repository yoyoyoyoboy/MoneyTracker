package com.moneytrack.moneytrack.entitiy;

import jakarta.persistence.*;

import java.util.Arrays;

@Entity
@Table(name = "expenseTable")

public class ExpenseTrackerEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    public ExpenseTrackerEntity() {
    }

    @Column(nullable = false)
    private String title;
    private String description;
    private String currency;
    private Integer amount;

    public ExpenseTrackerEntity(String title, String description, String currency, Integer amount) {
        this.title = title;
        this.description = description;
        this.currency = currency;
        this.amount = amount;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getCurrency() {
        return currency;
    }

    public Integer getAmount() {
        return amount;
    }
    
}
