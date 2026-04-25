package com.piko.home4u.service;

import com.piko.home4u.model.Transaction;
import com.piko.home4u.model.TransactionStatus;
import com.piko.home4u.model.User;
import com.piko.home4u.model.UserRole;
import com.piko.home4u.repository.PropertyRepository;
import com.piko.home4u.repository.TransactionRepository;
import com.piko.home4u.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PropertyRepository propertyRepository;
    @Mock private TransactionRepository transactionRepository;

    @InjectMocks private AdminService service;

    private User user(long id, UserRole role) {
        User u = new User("u" + id, "pw", id + "@x", "0", role);
        u.setId(id);
        return u;
    }

    private Transaction tx(long id, TransactionStatus s) {
        return Transaction.builder().id(id).status(s).build();
    }

    @Test
    void summary_aggregatesCountsAndGroups() {
        when(userRepository.count()).thenReturn(7L);
        when(propertyRepository.count()).thenReturn(12L);
        when(transactionRepository.count()).thenReturn(5L);

        when(userRepository.findByRole(UserRole.ROLE_USER))
                .thenReturn(List.of(user(1, UserRole.ROLE_USER), user(2, UserRole.ROLE_USER)));
        when(userRepository.findByRole(UserRole.ROLE_REALTOR))
                .thenReturn(List.of(user(3, UserRole.ROLE_REALTOR)));
        when(userRepository.findByRole(UserRole.ROLE_ADMIN))
                .thenReturn(List.of(user(4, UserRole.ROLE_ADMIN)));

        when(transactionRepository.findByStatus(TransactionStatus.PENDING))
                .thenReturn(List.of(tx(1, TransactionStatus.PENDING), tx(2, TransactionStatus.PENDING)));
        when(transactionRepository.findByStatus(TransactionStatus.APPROVED))
                .thenReturn(List.of(tx(3, TransactionStatus.APPROVED)));
        when(transactionRepository.findByStatus(TransactionStatus.REJECTED)).thenReturn(List.of());
        when(transactionRepository.findByStatus(TransactionStatus.COMPLETED))
                .thenReturn(List.of(tx(4, TransactionStatus.COMPLETED), tx(5, TransactionStatus.COMPLETED)));

        AdminService.Summary s = service.summary();

        assertThat(s.getTotalUsers()).isEqualTo(7);
        assertThat(s.getTotalProperties()).isEqualTo(12);
        assertThat(s.getTotalTransactions()).isEqualTo(5);
        assertThat(s.getUsersByRole()).containsEntry("ROLE_USER", 2L)
                .containsEntry("ROLE_REALTOR", 1L)
                .containsEntry("ROLE_ADMIN", 1L);
        assertThat(s.getTransactionsByStatus()).containsEntry("PENDING", 2L)
                .containsEntry("APPROVED", 1L)
                .containsEntry("COMPLETED", 2L)
                .containsEntry("REJECTED", 0L);
    }

    @Test
    void listUsers_delegatesToRepository() {
        when(userRepository.findAll()).thenReturn(List.of(user(1, UserRole.ROLE_USER)));
        assertThat(service.listUsers()).hasSize(1);
    }

    @Test
    void listTransactions_delegatesToRepository() {
        when(transactionRepository.findAll()).thenReturn(List.of(tx(1, TransactionStatus.PENDING)));
        assertThat(service.listTransactions()).hasSize(1);
    }
}
