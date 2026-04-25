package com.piko.home4u.repository;

import com.piko.home4u.model.Report;
import com.piko.home4u.model.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {

    List<Report> findByReporterIdOrderByCreatedAtDesc(Long reporterId);

    List<Report> findByStatusOrderByCreatedAtDesc(ReportStatus status);

    List<Report> findAllByOrderByCreatedAtDesc();
}
