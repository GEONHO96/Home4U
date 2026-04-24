package com.piko.home4u.controller;

import com.piko.home4u.model.ChatMessage;
import com.piko.home4u.model.ChatRoom;
import com.piko.home4u.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/chats")
@RequiredArgsConstructor
public class ChatController {
    private final ChatService chatService;

    /**
     * POST /chats?buyerId=&sellerId=&propertyId=  (sellerId 는 propertyId 가 있으면 무시됨)
     * 기존 방 있으면 재사용. body 불필요.
     */
    @PostMapping
    public ResponseEntity<ChatRoom> openRoom(
            @RequestParam Long buyerId,
            @RequestParam(required = false) Long sellerId,
            @RequestParam(required = false) Long propertyId
    ) {
        return ResponseEntity.ok(chatService.openRoom(buyerId, sellerId, propertyId));
    }

    /** 내 채팅방 목록. */
    @GetMapping
    public ResponseEntity<List<ChatRoom>> listMine(@RequestParam Long userId) {
        return ResponseEntity.ok(chatService.listMyRooms(userId));
    }

    /** 방의 모든 메시지 (시간순). */
    @GetMapping("/{roomId}/messages")
    public ResponseEntity<List<ChatMessage>> listMessages(
            @PathVariable Long roomId,
            @RequestParam Long userId
    ) {
        return ResponseEntity.ok(chatService.listMessages(roomId, userId));
    }

    /** 메시지 전송. body: { content: string }. */
    @PostMapping("/{roomId}/messages")
    public ResponseEntity<ChatMessage> sendMessage(
            @PathVariable Long roomId,
            @RequestParam Long userId,
            @RequestBody Map<String, String> body
    ) {
        return ResponseEntity.ok(chatService.sendMessage(roomId, userId, body.getOrDefault("content", "")));
    }

    /** 내가 받은 안 읽은 메시지를 모두 읽음 처리. */
    @PostMapping("/{roomId}/read")
    public ResponseEntity<Map<String, Object>> markRead(
            @PathVariable Long roomId,
            @RequestParam Long userId
    ) {
        int n = chatService.markRead(roomId, userId);
        return ResponseEntity.ok(Map.of("updated", n));
    }

    /** 안 읽은 개수. */
    @GetMapping("/{roomId}/unread-count")
    public ResponseEntity<Map<String, Object>> unread(
            @PathVariable Long roomId,
            @RequestParam Long userId
    ) {
        return ResponseEntity.ok(Map.of("count", chatService.countUnread(roomId, userId)));
    }
}
