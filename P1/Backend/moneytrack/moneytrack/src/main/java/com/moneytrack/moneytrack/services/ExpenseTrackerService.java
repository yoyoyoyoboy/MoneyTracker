package com.moneytrack.moneytrack.services;

import com.moneytrack.moneytrack.dto.ExpenseTrackerRequest;
import com.moneytrack.moneytrack.dto.ExpenseTrackerResponse;
import com.moneytrack.moneytrack.entitiy.ExpenseTrackerEntity;
import com.moneytrack.moneytrack.repository.ExpenseTrackerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequestMapping("api/expenseTracker")
public class ExpenseTrackerService {

    public final ExpenseTrackerRepository ExpenseTrackerRepository;

    public ExpenseTrackerService(ExpenseTrackerRepository ExpenseTrackerRepository) {
        this.ExpenseTrackerRepository = ExpenseTrackerRepository;
    }

    public ExpenseTrackerResponse createExpense(ExpenseTrackerRequest request) {
        ExpenseTrackerEntity expense = new ExpenseTrackerEntity(
                request.title(),
                request.description(),
                request.currency(),
                request.amount()
        );

        ExpenseTrackerEntity savedTask = ExpenseTrackerRepository.save(expense);

        return toResponse(savedTask);
    }

    public List<ExpenseTrackerResponse> getAllExpenses() {
        return ExpenseTrackerRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public void deleteExpense(Long id) {
        if(!ExpenseTrackerRepository.existsById(id)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Task not found:" + id
            );
        }

        ExpenseTrackerRepository.deleteById(id);
    }


    private ExpenseTrackerResponse toResponse(ExpenseTrackerEntity expense) {
        return new ExpenseTrackerResponse(
                expense.getId(),
                expense.getTitle(),
                expense.getDescription(),
                expense.getCurrency(),
                expense.getAmount()
        );
    }
}
