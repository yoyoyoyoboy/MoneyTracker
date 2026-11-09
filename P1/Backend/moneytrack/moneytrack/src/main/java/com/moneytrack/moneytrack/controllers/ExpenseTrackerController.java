package com.moneytrack.moneytrack.controllers;

import com.moneytrack.moneytrack.dto.ExpenseTrackerRequest;
import com.moneytrack.moneytrack.dto.ExpenseTrackerResponse;
import com.moneytrack.moneytrack.services.ExpenseTrackerService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/expenseTracker")
public class ExpenseTrackerController {
    public final ExpenseTrackerService service;

    public ExpenseTrackerController(ExpenseTrackerService ExpenseTrackerService) {
        this.service = ExpenseTrackerService;
    }

    @GetMapping
    public List<ExpenseTrackerResponse> getAllExpenses() {
        return service.getAllExpenses();
    }

    @PostMapping
    public ResponseEntity<ExpenseTrackerResponse> createExpense(@RequestBody ExpenseTrackerRequest request) {

        ExpenseTrackerResponse expense = service.createExpense(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(expense);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExpense(@PathVariable Long id) {
        service.deleteExpense(id);

        return ResponseEntity.accepted().build();
    }
}
