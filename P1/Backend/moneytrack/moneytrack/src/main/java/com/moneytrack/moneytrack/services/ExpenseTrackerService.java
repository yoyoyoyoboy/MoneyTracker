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
import java.time.Instant;

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

    public List<ExpenseTrackerResponse> getExpenses(Instant from, Instant to) {
        if (from == null && to == null) {
            return getAllExpenses();
        }
        if (from != null && to != null && !from.isBefore(to)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "from must be earlier than to");
        }

        List<ExpenseTrackerEntity> expenses;
        if (from == null) {
            expenses = ExpenseTrackerRepository.findByCreatedAtLessThanOrderByCreatedAtDesc(to);
        } else if (to == null) {
            expenses = ExpenseTrackerRepository.findByCreatedAtGreaterThanEqualOrderByCreatedAtDesc(from);
        } else {
            expenses = ExpenseTrackerRepository
                    .findByCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(from, to);
        }
        return expenses.stream().map(this::toResponse).toList();
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
                expense.getAmount(),
                expense.getCreatedAt()
        );
    }
}
