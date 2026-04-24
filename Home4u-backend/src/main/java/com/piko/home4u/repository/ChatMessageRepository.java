package com.piko.home4u.repository;

import com.piko.home4u.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;

import java.time.LocalDateTime;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByRoomIdOrderByCreatedAtAsc(Long roomId);

    @Query("SELECT COUNT(m) FROM ChatMessage m " +
            "WHERE m.room.id = :roomId AND m.sender.id <> :userId AND m.readAt IS NULL")
    long countUnreadForUser(Long roomId, Long userId);

    /** 내가 받은 안 읽은 메시지를 모두 읽음 처리 */
    @Modifying
    @Query("UPDATE ChatMessage m SET m.readAt = :now " +
            "WHERE m.room.id = :roomId AND m.sender.id <> :userId AND m.readAt IS NULL")
    int markRoomAsRead(Long roomId, Long userId, LocalDateTime now);
}
