package com.moneytrack.moneytrack.repository;

import com.moneytrack.moneytrack.entitiy.ExpenseTrackerEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExpenseTrackerRepository extends JpaRepository<ExpenseTrackerEntity, Long> {
}
