package com.piko.home4u.controller;

import com.piko.home4u.dto.SavedSearchDto;
import com.piko.home4u.model.Property;
import com.piko.home4u.model.SavedSearch;
import com.piko.home4u.service.SavedSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/saved-searches")
@RequiredArgsConstructor
public class SavedSearchController {
    private final SavedSearchService savedSearchService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@RequestBody SavedSearchDto dto) {
        SavedSearch saved = savedSearchService.save(dto);
        return ResponseEntity.ok(Map.of(
                "message", "검색 조건 저장 성공",
                "savedSearchId", saved.getId(),
                "name", saved.getName()
        ));
    }

    @GetMapping
    public ResponseEntity<List<SavedSearch>> listMy(@RequestParam Long userId) {
        return ResponseEntity.ok(savedSearchService.listMy(userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> delete(
            @PathVariable Long id,
            @RequestParam Long userId) {
        savedSearchService.delete(id, userId);
        return ResponseEntity.ok(Map.of("message", "검색 조건 삭제 성공"));
    }

    @GetMapping("/{id}/matching")
    public ResponseEntity<List<Property>> matching(@PathVariable Long id) {
        return ResponseEntity.ok(savedSearchService.runMatch(id));
    }
}
