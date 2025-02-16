package com.piko.home4u.service;

import com.piko.home4u.model.Post;
import com.piko.home4u.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PostService {
    private final PostRepository postRepository;

    // ✅ 1. 게시글 등록
    public Post createPost(Post post) {
        return postRepository.save(post);
    }

    // ✅ 2. 모든 게시글 조회
    public List<Post> getAllPosts() {
        return postRepository.findAll();
    }

    // ✅ 3. 특정 게시글 조회 (조회수 증가)
    public Post getPostById(Long id) {
        Post post = postRepository.findById(id).orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        post.setViews(post.getViews() + 1);
        return postRepository.save(post);
    }

    // ✅ 4. 특정 게시글 삭제
    public void deletePost(Long id) {
        if (!postRepository.existsById(id)) {
            throw new RuntimeException("삭제할 게시글이 존재하지 않습니다.");
        }
        postRepository.deleteById(id);
    }

    // ✅ 5. 게시글 좋아요 기능
    public Post likePost(Long id) {
        Post post = postRepository.findById(id).orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        post.setLikes(post.getLikes() + 1);
        return postRepository.save(post);
    }

    // ✅ 6. 카테고리별 게시글 조회
    public List<Post> getPostsByCategory(String category) {
        return postRepository.findByCategory(category);
    }

    // ✅ 7. 최근 N일 내 게시글 조회
    public List<Post> getRecentPosts(int days) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);
        return postRepository.findRecentPosts(startDate);
    }

    // ✅ 8. 좋아요 순 인기 게시글 조회 (상위 10개)
    public List<Post> getTopLikedPosts() {
        return postRepository.findTop10ByLikes();
    }

    // ✅ 9. 조회수 순 인기 게시글 조회 (상위 10개)
    public List<Post> getTopViewedPosts() {
        return postRepository.findTop10ByViews();
    }

    // ✅ 10. 키워드 검색 기능 (제목 및 내용에서 검색)
    public List<Post> searchPosts(String keyword) {
        return postRepository.searchByKeyword(keyword);
    }
}
