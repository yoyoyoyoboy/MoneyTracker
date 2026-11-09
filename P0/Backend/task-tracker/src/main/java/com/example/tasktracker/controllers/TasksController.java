package com.example.tasktracker.controllers;

import com.example.tasktracker.dto.CreateTaskRequest;
import com.example.tasktracker.dto.TaskResponse;
import com.example.tasktracker.services.TaskService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "http://localhost:4200")
public class TasksController {

    private final TaskService taskService;

    public TasksController(TaskService service) {
        this.taskService = service;
    }

    @GetMapping
    public List<TaskResponse> getAllTasks() {
        return taskService.getAllTasks();
    }


    @PostMapping
    public ResponseEntity<TaskResponse> createTask(
            @RequestBody CreateTaskRequest request) {

        TaskResponse task = taskService.createTask(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(task);
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);

        return ResponseEntity.noContent().build();
    }
}