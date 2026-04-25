package com.piko.home4u.controller;

import com.piko.home4u.model.Report;
import com.piko.home4u.model.ReportStatus;
import com.piko.home4u.model.ReportTargetType;
import com.piko.home4u.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@io.swagger.v3.oas.annotations.tags.Tag(name = "Reports", description = "매물·리뷰·사용자 신고 접수 + 관리자 처리완료/기각.")
@RestController
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    /** 신고 등록. body: {targetType, targetId, reason}, query: reporterId */
    @PostMapping("/reports")
    public ResponseEntity<Map<String, Object>> file(
            @RequestParam Long reporterId,
            @RequestBody Map<String, Object> body) {
        ReportTargetType targetType = ReportTargetType.valueOf(String.valueOf(body.get("targetType")));
        Long targetId = ((Number) body.get("targetId")).longValue();
        String reason = String.valueOf(body.getOrDefault("reason", "")).trim();
        Report saved = reportService.file(reporterId, targetType, targetId, reason);
        return ResponseEntity.ok(Map.of(
                "reportId", saved.getId(),
                "status", saved.getStatus().name(),
                "message", "신고가 접수되었습니다."
        ));
    }

    /** 내 신고 이력. */
    @GetMapping("/reports/mine")
    public ResponseEntity<List<Report>> listMine(@RequestParam Long reporterId) {
        return ResponseEntity.ok(reportService.listMine(reporterId));
    }

    /** 관리자 — 전체 / status 필터. */
    @GetMapping("/admin/reports")
    public ResponseEntity<List<Report>> listAdmin(@RequestParam(required = false) ReportStatus status) {
        if (status == null) {
            return ResponseEntity.ok(reportService.listAll());
        }
        if (status == ReportStatus.PENDING) {
            return ResponseEntity.ok(reportService.listPending());
        }
        return ResponseEntity.ok(reportService.listAll().stream()
                .filter(r -> r.getStatus() == status)
                .toList());
    }

    @PutMapping("/admin/reports/{id}/resolve")
    public ResponseEntity<Map<String, Object>> resolve(@PathVariable Long id) {
        Report r = reportService.transition(id, ReportStatus.RESOLVED);
        return ResponseEntity.ok(Map.of(
                "reportId", r.getId(),
                "status", r.getStatus().name(),
                "message", "신고를 처리 완료로 표시했습니다."));
    }

    @PutMapping("/admin/reports/{id}/dismiss")
    public ResponseEntity<Map<String, Object>> dismiss(@PathVariable Long id) {
        Report r = reportService.transition(id, ReportStatus.DISMISSED);
        return ResponseEntity.ok(Map.of(
                "reportId", r.getId(),
                "status", r.getStatus().name(),
                "message", "신고를 기각했습니다."));
    }
}
