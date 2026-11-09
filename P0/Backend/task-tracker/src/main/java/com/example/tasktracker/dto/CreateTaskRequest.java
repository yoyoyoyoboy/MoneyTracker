package com.example.tasktracker.dto;

public record CreateTaskRequest(
        String title,
        String description
) {
}
