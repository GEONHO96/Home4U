package com.piko.home4u.repository;

import com.piko.home4u.model.Faq;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FaqRepository extends JpaRepository<Faq, Long> {

    /**
     * 질문 또는 답변에 키워드가 포함된 FAQ 검색
     */
    @Query("""
        SELECT f
          FROM Faq f
         WHERE LOWER(f.question) LIKE LOWER(CONCAT('%', :kw, '%'))
            OR LOWER(f.answer)   LIKE LOWER(CONCAT('%', :kw, '%'))
         ORDER BY f.sortOrder ASC
        """)
    List<Faq> searchByKeyword(@Param("kw") String keyword);

    /**
     * 카테고리별 FAQ 목록 (정렬)
     */
    @Query("SELECT f FROM Faq f WHERE f.category = :cat ORDER BY f.sortOrder ASC")
    List<Faq> findByCategory(@Param("cat") String category);

    /**
     * 전체 FAQ를 순서대로 조회
     */
    @Query("SELECT f FROM Faq f ORDER BY f.sortOrder ASC")
    List<Faq> findAllOrdered();
}