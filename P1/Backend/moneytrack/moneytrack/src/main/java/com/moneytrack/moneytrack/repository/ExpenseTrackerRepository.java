package com.moneytrack.moneytrack.repository;

import com.moneytrack.moneytrack.entitiy.ExpenseTrackerEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.List;

public interface ExpenseTrackerRepository extends JpaRepository<ExpenseTrackerEntity, Long> {
    List<ExpenseTrackerEntity> findByCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
            Instant from, Instant to);

    List<ExpenseTrackerEntity> findByCreatedAtGreaterThanEqualOrderByCreatedAtDesc(Instant from);

    List<ExpenseTrackerEntity> findByCreatedAtLessThanOrderByCreatedAtDesc(Instant to);
}
