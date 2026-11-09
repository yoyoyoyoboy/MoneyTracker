package com.moneytrack.moneytrack.controllers;

import com.moneytrack.moneytrack.entitiy.ExpenseTrackerEntity;
import com.moneytrack.moneytrack.repository.ExpenseTrackerRepository;
import com.moneytrack.moneytrack.services.ExpenseTrackerService;
import jakarta.persistence.EntityManager;
import org.hibernate.SessionFactory;
import org.hibernate.cfg.Configuration;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.support.JpaRepositoryFactory;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ExpenseTrackerFilterTests {
    private SessionFactory factory;
    private EntityManager entityManager;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        factory = new Configuration()
                .addAnnotatedClass(ExpenseTrackerEntity.class)
                .setProperty("hibernate.connection.driver_class", "org.h2.Driver")
                .setProperty("hibernate.connection.url", "jdbc:h2:mem:expense_filters")
                .setProperty("hibernate.hbm2ddl.auto", "create-drop")
                .buildSessionFactory();
        entityManager = factory.createEntityManager();
        entityManager.getTransaction().begin();
        addExpense("Before", "2026-11-09T00:00:00Z");
        addExpense("Start", "2026-11-10T00:00:00Z");
        addExpense("Middle", "2026-11-10T12:00:00Z");
        addExpense("End", "2026-11-11T00:00:00Z");
        entityManager.getTransaction().commit();
        entityManager.clear();

        ExpenseTrackerRepository repository = new JpaRepositoryFactory(entityManager)
                .getRepository(ExpenseTrackerRepository.class);
        mvc = MockMvcBuilders.standaloneSetup(
                new ExpenseTrackerController(new ExpenseTrackerService(repository))).build();
    }

    private void addExpense(String title, String timestamp) {
        ExpenseTrackerEntity expense = new ExpenseTrackerEntity(title, "", "INR", 100);
        entityManager.persist(expense);
        entityManager.flush();
        entityManager.createQuery("update ExpenseTrackerEntity e set e.createdAt = :time where e.id = :id")
                .setParameter("time", Instant.parse(timestamp))
                .setParameter("id", expense.getId())
                .executeUpdate();
    }

    @AfterEach
    void tearDown() {
        if (entityManager != null) entityManager.close();
        if (factory != null) factory.close();
    }

    @Test
    void includesStartExcludesEndAndSortsNewestFirst() throws Exception {
        mvc.perform(get("/expenseTracker")
                        .param("from", "2026-11-10T00:00:00Z")
                        .param("to", "2026-11-11T00:00:00Z"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].title").value("Middle"))
                .andExpect(jsonPath("$[1].title").value("Start"));
    }

    @Test
    void acceptsFromOnlyWithTimezoneOffset() throws Exception {
        mvc.perform(get("/expenseTracker").param("from", "2026-11-10T05:30:00+05:30"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].title").value("End"));
    }

    @Test
    void acceptsToOnly() throws Exception {
        mvc.perform(get("/expenseTracker").param("to", "2026-11-10T00:00:00Z"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Before"));
    }

    @Test
    void returnsAllExpensesWithoutFilters() throws Exception {
        mvc.perform(get("/expenseTracker"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(4));
    }

    @Test
    void returnsEmptyArrayWhenNothingMatches() throws Exception {
        mvc.perform(get("/expenseTracker").param("from", "2027-01-01T00:00:00Z"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    @Test
    void rejectsEqualOrReversedBounds() throws Exception {
        for (String to : new String[]{"2026-11-10T00:00:00Z", "2026-11-09T00:00:00Z"}) {
            mvc.perform(get("/expenseTracker")
                            .param("from", "2026-11-10T00:00:00Z").param("to", to))
                    .andExpect(status().isBadRequest());
        }
    }

    @Test
    void rejectsMalformedTimestamp() throws Exception {
        mvc.perform(get("/expenseTracker").param("from", "not-a-timestamp"))
                .andExpect(status().isBadRequest());
    }
}
