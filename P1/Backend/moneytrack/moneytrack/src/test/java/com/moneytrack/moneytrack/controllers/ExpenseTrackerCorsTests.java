package com.moneytrack.moneytrack.controllers;

import com.moneytrack.moneytrack.services.ExpenseTrackerService;
import com.moneytrack.moneytrack.dto.ExpenseTrackerResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpHeaders;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mock.web.MockServletContext;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ExpenseTrackerCorsTests {
    private static final String PRODUCTION_ORIGIN = "https://moneytracker-2rv2.onrender.com";
    private MockMvc mvc;
    private AnnotationConfigWebApplicationContext context;

    @BeforeEach
    void setUp() {
        context = new AnnotationConfigWebApplicationContext();
        context.setServletContext(new MockServletContext());
        context.register(TestConfig.class);
        context.refresh();
        mvc = MockMvcBuilders.webAppContextSetup(context).build();
    }

    @AfterEach
    void tearDown() {
        context.close();
    }

    @Configuration
    @EnableWebMvc
    static class TestConfig {
        @Bean
        ExpenseTrackerController controller() {
            return new ExpenseTrackerController(new ExpenseTrackerService(null) {
                @Override
                public List<ExpenseTrackerResponse> getAllExpenses() {
                    return List.of();
                }
            });
        }
    }

    @ParameterizedTest
    @ValueSource(strings = {PRODUCTION_ORIGIN, "http://localhost:4200"})
    void allowsGetFromFrontend(String origin) throws Exception {
        mvc.perform(get("/expenseTracker").header(HttpHeaders.ORIGIN, origin))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, origin));
    }

    @ParameterizedTest
    @ValueSource(strings = {"POST", "DELETE"})
    void allowsProductionPreflight(String method) throws Exception {
        String path = method.equals("DELETE") ? "/expenseTracker/1" : "/expenseTracker";
        mvc.perform(options(path)
                        .header(HttpHeaders.ORIGIN, PRODUCTION_ORIGIN)
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, method)
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, PRODUCTION_ORIGIN))
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS, method))
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS, "content-type"));
    }

    @Test
    void rejectsUnlistedOrigin() throws Exception {
        mvc.perform(get("/expenseTracker").header(HttpHeaders.ORIGIN, "https://untrusted.example"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
    }
}
