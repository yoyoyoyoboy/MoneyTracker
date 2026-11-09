package com.example.tasktracker.repository;

import com.example.tasktracker.entity.taskentity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskRepository
        extends JpaRepository<taskentity, Long> {

}
