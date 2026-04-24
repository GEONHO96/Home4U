package com.piko.home4u.repository;

import com.piko.home4u.model.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    /** buyer, seller, property 조합으로 기존 방 탐색 (null property 포함) */
    @Query("SELECT r FROM ChatRoom r " +
            "WHERE r.buyer.id = :buyerId AND r.seller.id = :sellerId " +
            "AND ((:propertyId IS NULL AND r.property IS NULL) OR r.property.id = :propertyId)")
    Optional<ChatRoom> findExisting(Long buyerId, Long sellerId, Long propertyId);

    /** 내가 buyer 또는 seller 인 방, 최근 메시지순 */
    @Query("SELECT r FROM ChatRoom r " +
            "WHERE r.buyer.id = :userId OR r.seller.id = :userId " +
            "ORDER BY r.lastMessageAt DESC")
    List<ChatRoom> findMine(Long userId);
}
