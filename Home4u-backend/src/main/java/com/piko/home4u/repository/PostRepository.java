package com.piko.home4u.repository;

import com.piko.home4u.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    // ✅ 1. 특정 카테고리별 게시글 조회
    List<Post> findByCategory(String category);

    // ✅ 2. 특정 기간(최근 n일) 내 게시글 조회
    @Query("SELECT p FROM Post p WHERE p.createdAt >= :startDate")
    List<Post> findRecentPosts(LocalDateTime startDate);

    // ✅ 3. 좋아요 수가 많은 인기 게시글 (상위 10개)
    @Query("SELECT p FROM Post p ORDER BY p.likes DESC")
    List<Post> findTop10ByLikes();

    // ✅ 4. 조회수가 많은 인기 게시글 (상위 10개)
    @Query("SELECT p FROM Post p ORDER BY p.views DESC")
    List<Post> findTop10ByViews();

    // ✅ 5. 제목 또는 내용으로 검색 (키워드 포함)
    @Query("SELECT p FROM Post p WHERE LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Post> searchByKeyword(String keyword);
}
