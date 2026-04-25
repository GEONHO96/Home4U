package com.piko.home4u.service;

import com.piko.home4u.model.Transaction;
import com.piko.home4u.model.TransactionStatus;
import com.piko.home4u.model.User;
import com.piko.home4u.model.UserRole;
import com.piko.home4u.repository.PropertyRepository;
import com.piko.home4u.repository.TransactionRepository;
import com.piko.home4u.repository.UserRepository;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 운영자 콘솔 집계/운영 서비스.
 * 모든 메서드는 ROLE_ADMIN 이 붙은 요청에서만 호출된다 (SecurityConfig 에서 차단).
 */
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final TransactionRepository transactionRepository;

    @Transactional(readOnly = true)
    public Summary summary() {
        Map<UserRole, Long> usersByRole = new EnumMap<>(UserRole.class);
        for (UserRole r : UserRole.values()) {
            usersByRole.put(r, (long) userRepository.findByRole(r).size());
        }
        // 거래 상태 집계
        Map<String, Long> txByStatus = new LinkedHashMap<>();
        for (TransactionStatus s : TransactionStatus.values()) {
            txByStatus.put(s.name(), (long) transactionRepository.findByStatus(s).size());
        }
        Map<String, Long> roleCountsExport = new LinkedHashMap<>();
        usersByRole.forEach((k, v) -> roleCountsExport.put(k.name(), v));

        return Summary.builder()
                .totalUsers(userRepository.count())
                .totalProperties(propertyRepository.count())
                .totalTransactions(transactionRepository.count())
                .usersByRole(roleCountsExport)
                .transactionsByStatus(txByStatus)
                .build();
    }

    @Transactional(readOnly = true)
    public List<User> listUsers() {
        return userRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Transaction> listTransactions() {
        return transactionRepository.findAll();
    }

    @Getter
    @lombok.Builder
    public static class Summary {
        private final long totalUsers;
        private final long totalProperties;
        private final long totalTransactions;
        private final Map<String, Long> usersByRole;
        private final Map<String, Long> transactionsByStatus;
    }
}
