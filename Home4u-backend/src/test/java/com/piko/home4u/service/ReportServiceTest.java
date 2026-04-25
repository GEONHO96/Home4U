package com.piko.home4u.service;

import com.piko.home4u.model.Report;
import com.piko.home4u.model.ReportStatus;
import com.piko.home4u.model.ReportTargetType;
import com.piko.home4u.model.User;
import com.piko.home4u.model.UserRole;
import com.piko.home4u.repository.ReportRepository;
import com.piko.home4u.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock private ReportRepository reportRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks private ReportService service;

    private User user(long id) {
        User u = new User("u" + id, "pw", id + "@x", "0", UserRole.ROLE_USER);
        u.setId(id);
        return u;
    }

    @Test
    void file_persistsReportWithPendingStatus() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L)));
        when(reportRepository.save(any(Report.class))).thenAnswer(inv -> {
            Report r = inv.getArgument(0);
            r.setId(7L);
            return r;
        });

        Report saved = service.file(1L, ReportTargetType.PROPERTY, 42L, "허위 매물");

        assertThat(saved.getId()).isEqualTo(7L);
        assertThat(saved.getStatus()).isEqualTo(ReportStatus.PENDING);
        assertThat(saved.getTargetType()).isEqualTo(ReportTargetType.PROPERTY);
        assertThat(saved.getTargetId()).isEqualTo(42L);
        assertThat(saved.getReason()).isEqualTo("허위 매물");
    }

    @Test
    void file_blankReason_rejected() {
        assertThatThrownBy(() -> service.file(1L, ReportTargetType.REVIEW, 1L, "  "))
                .hasMessageContaining("사유");
        verify(reportRepository, never()).save(any(Report.class));
    }

    @Test
    void file_tooLongReason_rejected() {
        String longReason = "x".repeat(501);
        assertThatThrownBy(() -> service.file(1L, ReportTargetType.REVIEW, 1L, longReason))
                .hasMessageContaining("500자");
        verify(reportRepository, never()).save(any(Report.class));
    }

    @Test
    void transition_pendingToResolved_setsResolvedAt() {
        Report r = Report.builder().id(7L).status(ReportStatus.PENDING).build();
        when(reportRepository.findById(7L)).thenReturn(Optional.of(r));
        when(reportRepository.save(any(Report.class))).thenAnswer(inv -> inv.getArgument(0));

        Report after = service.transition(7L, ReportStatus.RESOLVED);

        assertThat(after.getStatus()).isEqualTo(ReportStatus.RESOLVED);
        assertThat(after.getResolvedAt()).isNotNull();
    }

    @Test
    void transition_alreadyResolved_rejected() {
        Report r = Report.builder().id(7L).status(ReportStatus.RESOLVED).build();
        when(reportRepository.findById(7L)).thenReturn(Optional.of(r));
        assertThatThrownBy(() -> service.transition(7L, ReportStatus.DISMISSED))
                .hasMessageContaining("이미 처리");
    }

    @Test
    void transition_toPending_rejected() {
        assertThatThrownBy(() -> service.transition(7L, ReportStatus.PENDING))
                .hasMessageContaining("PENDING");
    }
}
