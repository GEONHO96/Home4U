package com.piko.home4u.service;

import com.piko.home4u.model.ChatMessage;
import com.piko.home4u.model.ChatRoom;
import com.piko.home4u.model.Property;
import com.piko.home4u.model.User;
import com.piko.home4u.repository.ChatMessageRepository;
import com.piko.home4u.repository.ChatRoomRepository;
import com.piko.home4u.repository.PropertyRepository;
import com.piko.home4u.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class ChatService {
    private final ChatRoomRepository roomRepository;
    private final ChatMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;

    /** STOMP broker. WebSocketConfig 가 활성화되면 자동 주입, 없으면(또는 단위 테스트) null 이면 broadcast skip. */
    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    /**
     * 방을 생성하거나 기존 방 재사용. 본인과 대화방을 만들 수 없다.
     * propertyId 가 주어지면 자동으로 seller 는 property.owner.id 로 보정한다 (buyerId 가 매물 소유자면 거부).
     */
    @Transactional
    public ChatRoom openRoom(Long buyerId, Long sellerId, Long propertyId) {
        if (Objects.equals(buyerId, sellerId)) {
            throw new RuntimeException("자기 자신과 채팅방을 만들 수 없습니다.");
        }

        Property property = null;
        if (propertyId != null) {
            property = propertyRepository.findById(propertyId)
                    .orElseThrow(() -> new RuntimeException("매물을 찾을 수 없습니다."));
            // 매물이 지정되면 seller 는 소유자로 강제
            if (property.getOwner() != null) {
                sellerId = property.getOwner().getId();
            }
            if (Objects.equals(buyerId, sellerId)) {
                throw new RuntimeException("본인이 등록한 매물에 대해 채팅을 열 수 없습니다.");
            }
        }

        Long normalizedPropertyId = property != null ? property.getId() : null;
        var existing = roomRepository.findExisting(buyerId, sellerId, normalizedPropertyId);
        if (existing.isPresent()) return existing.get();

        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new RuntimeException("구매자를 찾을 수 없습니다."));
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new RuntimeException("판매자를 찾을 수 없습니다."));

        ChatRoom room = ChatRoom.builder()
                .buyer(buyer)
                .seller(seller)
                .property(property)
                .build();
        return roomRepository.save(room);
    }

    public List<ChatRoom> listMyRooms(Long userId) {
        return roomRepository.findMine(userId);
    }

    public List<ChatMessage> listMessages(Long roomId, Long userId) {
        ChatRoom room = getParticipantRoom(roomId, userId);
        return messageRepository.findByRoomIdOrderByCreatedAtAsc(room.getId());
    }

    @Transactional
    public ChatMessage sendMessage(Long roomId, Long senderId, String content) {
        if (content == null || content.isBlank()) {
            throw new RuntimeException("빈 메시지는 보낼 수 없습니다.");
        }
        ChatRoom room = getParticipantRoom(roomId, senderId);
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        ChatMessage msg = ChatMessage.builder()
                .room(room)
                .sender(sender)
                .content(content)
                .build();
        ChatMessage saved = messageRepository.save(msg);

        room.setLastMessageAt(LocalDateTime.now());
        roomRepository.save(room);

        // STOMP broadcast to subscribers of this room (subscription path: /topic/chats.{roomId}).
        if (messagingTemplate != null) {
            messagingTemplate.convertAndSend("/topic/chats." + room.getId(), saved);
        }
        return saved;
    }

    @Transactional
    public int markRead(Long roomId, Long userId) {
        getParticipantRoom(roomId, userId);
        return messageRepository.markRoomAsRead(roomId, userId, LocalDateTime.now());
    }

    public long countUnread(Long roomId, Long userId) {
        getParticipantRoom(roomId, userId);
        return messageRepository.countUnreadForUser(roomId, userId);
    }

    /** 방 조회 + 참가자 검증. */
    private ChatRoom getParticipantRoom(Long roomId, Long userId) {
        ChatRoom room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("채팅방을 찾을 수 없습니다."));
        if (!isParticipant(room, userId)) {
            throw new RuntimeException("이 채팅방의 참가자가 아닙니다.");
        }
        return room;
    }

    private static boolean isParticipant(ChatRoom room, Long userId) {
        return (room.getBuyer() != null && Objects.equals(room.getBuyer().getId(), userId))
                || (room.getSeller() != null && Objects.equals(room.getSeller().getId(), userId));
    }
}
