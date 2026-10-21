
package com.expensetracker.expense_tracker.controller;

import com.expensetracker.expense_tracker.entity.Transaction;
import com.expensetracker.expense_tracker.repository.TransactionRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import com.expensetracker.expense_tracker.entity.TransactionType;
import java.math.BigDecimal;
import com.expensetracker.expense_tracker.entity.TransactionType;
import java.util.Map;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionRepository transactionRepository;

    public TransactionController(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    @PostMapping
    public Transaction addTransaction(@Valid @RequestBody Transaction transaction) {
        return transactionRepository.save(transaction);
    }


    @GetMapping
    public List<Transaction> getAllTransactions(
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) String category) {

        List<Transaction> transactions = transactionRepository.findAll();

        return transactions.stream()
                .filter(t -> type == null || t.getType() == type)
                .filter(t -> category == null ||
                        t.getCategory().equalsIgnoreCase(category))
                .toList();
    }



    @PutMapping("/{id}")
    public Transaction updateTransaction(
            @PathVariable Long id,
            @Valid @RequestBody Transaction updatedTransaction) {

        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Transaction not found"));

        transaction.setTitle(updatedTransaction.getTitle());
        transaction.setAmount(updatedTransaction.getAmount());
        transaction.setType(updatedTransaction.getType());
        transaction.setCategory(updatedTransaction.getCategory());
        transaction.setDate(updatedTransaction.getDate());
        transaction.setDescription(updatedTransaction.getDescription());

        return transactionRepository.save(transaction);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTransaction(@PathVariable Long id) {

        if (!transactionRepository.existsById(id)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Transaction not found");
        }

        transactionRepository.deleteById(id);
    }

    @GetMapping("/summary")
    public Map<String, BigDecimal> getSummary() {

        List<Transaction> transactions = transactionRepository.findAll();

        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpenses = BigDecimal.ZERO;

        for (Transaction transaction : transactions) {

            if (transaction.getType() == TransactionType.INCOME) {
                totalIncome = totalIncome.add(transaction.getAmount());
            }

            if (transaction.getType() == TransactionType.EXPENSE) {
                totalExpenses = totalExpenses.add(transaction.getAmount());
            }
        }

        BigDecimal balance = totalIncome.subtract(totalExpenses);

        return Map.of(
                "totalIncome", totalIncome,
                "totalExpenses", totalExpenses,
                "balance", balance
        );
    }


}