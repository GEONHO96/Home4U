package com.piko.home4u.service;

import com.piko.home4u.model.Report;
import com.piko.home4u.model.ReportStatus;
import com.piko.home4u.model.ReportTargetType;
import com.piko.home4u.model.User;
import com.piko.home4u.repository.ReportRepository;
import com.piko.home4u.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;

    @Transactional
    public Report file(Long reporterId, ReportTargetType targetType, Long targetId, String reason) {
        if (reason == null || reason.isBlank()) {
            throw new RuntimeException("신고 사유를 입력해주세요.");
        }
        if (reason.length() > 500) {
            throw new RuntimeException("신고 사유는 500자 이내로 입력해주세요.");
        }
        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        Report r = Report.builder()
                .reporter(reporter)
                .targetType(targetType)
                .targetId(targetId)
                .reason(reason.trim())
                .status(ReportStatus.PENDING)
                .build();
        return reportRepository.save(r);
    }

    @Transactional(readOnly = true)
    public List<Report> listMine(Long reporterId) {
        return reportRepository.findByReporterIdOrderByCreatedAtDesc(reporterId);
    }

    @Transactional(readOnly = true)
    public List<Report> listAll() {
        return reportRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<Report> listPending() {
        return reportRepository.findByStatusOrderByCreatedAtDesc(ReportStatus.PENDING);
    }

    @Transactional
    public Report transition(Long reportId, ReportStatus next) {
        if (next == ReportStatus.PENDING) {
            throw new RuntimeException("PENDING 으로는 되돌릴 수 없습니다.");
        }
        Report r = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("신고를 찾을 수 없습니다."));
        if (r.getStatus() != ReportStatus.PENDING) {
            throw new RuntimeException("이미 처리된 신고입니다.");
        }
        r.setStatus(next);
        r.setResolvedAt(LocalDateTime.now());
        return reportRepository.save(r);
    }
}
