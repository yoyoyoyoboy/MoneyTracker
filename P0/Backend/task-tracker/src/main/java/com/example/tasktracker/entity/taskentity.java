package com.example.tasktracker.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "tasks")

public class taskentity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    long id;

    @Column(nullable = false)
    private String title;
    private String description;
    private boolean completed;

    public taskentity() {
    }

    public taskentity(String title, String description,
                      boolean completed) {
        this.title = title;
        this.description = description;
        this.completed = completed;
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

    public boolean isCompleted() {
        return completed;
    }


}
