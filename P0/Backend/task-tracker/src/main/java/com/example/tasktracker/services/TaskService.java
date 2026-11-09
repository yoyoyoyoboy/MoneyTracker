package com.example.tasktracker.services;

import com.example.tasktracker.dto.CreateTaskRequest;
import com.example.tasktracker.dto.TaskResponse;
import com.example.tasktracker.entity.taskentity;
import com.example.tasktracker.repository.TaskRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class TaskService {

    private final TaskRepository taskRepository;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public TaskResponse createTask(CreateTaskRequest createRequest) {

        taskentity task = new taskentity(
                createRequest.title(),
                createRequest.description(),
                false
        );

        taskentity savedTask = taskRepository.save(task);

        return toResponse(savedTask);
    }

    public List<TaskResponse> getAllTasks() {
        return taskRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public void deleteTask(Long id) {
        if(!taskRepository.existsById(id)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Task not found:" + id
            );
        }
    }

    private TaskResponse toResponse(taskentity task) {
        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.isCompleted()
        );
    }
}
