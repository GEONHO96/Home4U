package com.piko.home4u.controller;

import com.piko.home4u.model.Faq;
import com.piko.home4u.service.FaqService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/faqs")
@RequiredArgsConstructor
public class FaqController {
    private final FaqService faqService;

    /** GET /faqs → 전체 FAQ 조회 */
    @GetMapping
    public ResponseEntity<List<Faq>> listAll() {
        return ResponseEntity.ok(faqService.getAllOrdered());
    }

    /** GET /faqs/category?cat={category} → 카테고리별 조회 */
    @GetMapping("/category")
    public ResponseEntity<List<Faq>> listByCategory(@RequestParam("cat") String category) {
        return ResponseEntity.ok(faqService.getByCategory(category));
    }

    /** GET /faqs/search?kw={keyword} → 키워드 검색 */
    @GetMapping("/search")
    public ResponseEntity<List<Faq>> search(@RequestParam("kw") String keyword) {
        return ResponseEntity.ok(faqService.searchByKeyword(keyword));
    }
}