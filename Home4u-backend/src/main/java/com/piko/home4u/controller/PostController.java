package com.piko.home4u.controller;

import com.piko.home4u.model.Post;
import com.piko.home4u.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/posts")
@RequiredArgsConstructor
public class PostController {
    private final PostService postService;

    // ✅ 1. 게시글 등록
    @PostMapping
    public ResponseEntity<Post> createPost(@RequestBody Post post) {
        return ResponseEntity.ok(postService.createPost(post));
    }

    // ✅ 2. 전체 게시글 조회
    @GetMapping
    public ResponseEntity<List<Post>> getAllPosts() {
        return ResponseEntity.ok(postService.getAllPosts());
    }

    // ✅ 3. 특정 게시글 조회 (조회수 증가)
    @GetMapping("/{id}")
    public ResponseEntity<Post> getPostById(@PathVariable Long id) {
        return ResponseEntity.ok(postService.getPostById(id));
    }

    // ✅ 4. 특정 게시글 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deletePost(@PathVariable Long id) {
        postService.deletePost(id);
        return ResponseEntity.ok("게시글 삭제 완료");
    }

    // ✅ 5. 게시글 좋아요 기능
    @PostMapping("/{id}/like")
    public ResponseEntity<Post> likePost(@PathVariable Long id) {
        return ResponseEntity.ok(postService.likePost(id));
    }

    // ✅ 6. 특정 카테고리 게시글 조회
    @GetMapping("/category")
    public ResponseEntity<List<Post>> getPostsByCategory(@RequestParam String category) {
        return ResponseEntity.ok(postService.getPostsByCategory(category));
    }

    // ✅ 7. 최근 N일 내 게시글 조회
    @GetMapping("/recent")
    public ResponseEntity<List<Post>> getRecentPosts(@RequestParam int days) {
        return ResponseEntity.ok(postService.getRecentPosts(days));
    }

    // ✅ 8. 좋아요 순 인기 게시글 조회
    @GetMapping("/top-liked")
    public ResponseEntity<List<Post>> getTopLikedPosts() {
        return ResponseEntity.ok(postService.getTopLikedPosts());
    }

    // ✅ 9. 조회수 순 인기 게시글 조회
    @GetMapping("/top-viewed")
    public ResponseEntity<List<Post>> getTopViewedPosts() {
        return ResponseEntity.ok(postService.getTopViewedPosts());
    }

    // ✅ 10. 키워드 검색 기능
    @GetMapping("/search")
    public ResponseEntity<List<Post>> searchPosts(@RequestParam String keyword) {
        return ResponseEntity.ok(postService.searchPosts(keyword));
    }
}
