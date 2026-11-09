package com.example.tasktracker.dto;

public record TaskResponse (Long id, String title, String description, Boolean completed){
}
