package com.piko.home4u.service;

import com.piko.home4u.model.Faq;
import com.piko.home4u.repository.FaqRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FaqService {
    private final FaqRepository faqRepository;

    /** 전체 FAQ를 sortOrder 순으로 가져오기 */
    public List<Faq> getAllOrdered() {
        return faqRepository.findAllOrdered();
    }

    /** 특정 카테고리 FAQ 조회 */
    public List<Faq> getByCategory(String category) {
        return faqRepository.findByCategory(category);
    }

    /** 질문/답변에 키워드 포함된 FAQ 검색 */
    public List<Faq> searchByKeyword(String keyword) {
        return faqRepository.searchByKeyword(keyword);
    }
}