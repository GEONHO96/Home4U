package com.piko.home4u.service;

import com.piko.home4u.model.ChatMessage;
import com.piko.home4u.model.ChatRoom;
import com.piko.home4u.model.Property;
import com.piko.home4u.model.User;
import com.piko.home4u.model.UserRole;
import com.piko.home4u.repository.ChatMessageRepository;
import com.piko.home4u.repository.ChatRoomRepository;
import com.piko.home4u.repository.PropertyRepository;
import com.piko.home4u.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock private ChatRoomRepository roomRepository;
    @Mock private ChatMessageRepository messageRepository;
    @Mock private UserRepository userRepository;
    @Mock private PropertyRepository propertyRepository;

    @InjectMocks private ChatService service;

    private User user(long id) {
        User u = new User("u" + id, "pw", "e" + id + "@x", "010", UserRole.ROLE_USER);
        u.setId(id);
        return u;
    }

    private Property propertyOwnedBy(long id, long ownerId) {
        Property p = new Property();
        p.setId(id);
        p.setOwner(user(ownerId));
        return p;
    }

    @Test
    void openRoom_reusesExisting() {
        ChatRoom existing = ChatRoom.builder().id(77L).buyer(user(1L)).seller(user(2L)).build();
        when(roomRepository.findExisting(1L, 2L, null)).thenReturn(Optional.of(existing));

        ChatRoom room = service.openRoom(1L, 2L, null);

        assertThat(room.getId()).isEqualTo(77L);
        verify(roomRepository, never()).save(any(ChatRoom.class));
    }

    @Test
    void openRoom_createsNewWhenAbsent() {
        when(roomRepository.findExisting(1L, 2L, null)).thenReturn(Optional.empty());
        when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L)));
        when(userRepository.findById(2L)).thenReturn(Optional.of(user(2L)));
        when(roomRepository.save(any(ChatRoom.class))).thenAnswer(inv -> {
            ChatRoom r = inv.getArgument(0);
            r.setId(99L);
            return r;
        });

        ChatRoom room = service.openRoom(1L, 2L, null);

        assertThat(room.getId()).isEqualTo(99L);
        assertThat(room.getBuyer().getId()).isEqualTo(1L);
        assertThat(room.getSeller().getId()).isEqualTo(2L);
    }

    @Test
    void openRoom_withProperty_overridesSellerToOwner() {
        // buyer=1, seller=null, property owner=9
        when(propertyRepository.findById(5L)).thenReturn(Optional.of(propertyOwnedBy(5L, 9L)));
        when(roomRepository.findExisting(1L, 9L, 5L)).thenReturn(Optional.empty());
        when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L)));
        when(userRepository.findById(9L)).thenReturn(Optional.of(user(9L)));
        when(roomRepository.save(any(ChatRoom.class))).thenAnswer(inv -> {
            ChatRoom r = inv.getArgument(0);
            r.setId(55L);
            return r;
        });

        ChatRoom room = service.openRoom(1L, null, 5L);

        assertThat(room.getSeller().getId()).isEqualTo(9L);
        assertThat(room.getProperty().getId()).isEqualTo(5L);
    }

    @Test
    void openRoom_selfChat_rejected() {
        assertThatThrownBy(() -> service.openRoom(1L, 1L, null))
                .hasMessageContaining("자기 자신");
        verify(roomRepository, never()).save(any(ChatRoom.class));
    }

    @Test
    void openRoom_ownerChatsOwnProperty_rejected() {
        // buyer=9, property.owner=9 → self
        when(propertyRepository.findById(5L)).thenReturn(Optional.of(propertyOwnedBy(5L, 9L)));

        assertThatThrownBy(() -> service.openRoom(9L, null, 5L))
                .hasMessageContaining("본인이 등록");
    }

    @Test
    void sendMessage_rejectsBlankContent() {
        assertThatThrownBy(() -> service.sendMessage(1L, 1L, "   "))
                .hasMessageContaining("빈 메시지");
        verify(messageRepository, never()).save(any(ChatMessage.class));
    }

    @Test
    void sendMessage_onlyParticipantsAllowed() {
        ChatRoom room = ChatRoom.builder().id(1L).buyer(user(1L)).seller(user(2L)).build();
        when(roomRepository.findById(1L)).thenReturn(Optional.of(room));

        assertThatThrownBy(() -> service.sendMessage(1L, 99L, "hi"))
                .hasMessageContaining("참가자");
        verify(messageRepository, never()).save(any(ChatMessage.class));
    }

    @Test
    void sendMessage_savesAndTouchesRoom() {
        ChatRoom room = ChatRoom.builder().id(1L).buyer(user(1L)).seller(user(2L)).build();
        when(roomRepository.findById(1L)).thenReturn(Optional.of(room));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L)));
        when(messageRepository.save(any(ChatMessage.class))).thenAnswer(inv -> {
            ChatMessage m = inv.getArgument(0);
            m.setId(42L);
            return m;
        });

        ChatMessage msg = service.sendMessage(1L, 1L, "hello");

        assertThat(msg.getId()).isEqualTo(42L);
        assertThat(msg.getContent()).isEqualTo("hello");
        verify(roomRepository).save(room); // lastMessageAt 갱신
    }

    @Test
    void markRead_onlyParticipantsAllowed() {
        ChatRoom room = ChatRoom.builder().id(1L).buyer(user(1L)).seller(user(2L)).build();
        when(roomRepository.findById(1L)).thenReturn(Optional.of(room));

        assertThatThrownBy(() -> service.markRead(1L, 99L))
                .hasMessageContaining("참가자");
    }

    @Test
    void countUnread_delegatesWithParticipantCheck() {
        ChatRoom room = ChatRoom.builder().id(1L).buyer(user(1L)).seller(user(2L)).build();
        when(roomRepository.findById(1L)).thenReturn(Optional.of(room));
        when(messageRepository.countUnreadForUser(1L, 1L)).thenReturn(3L);

        assertThat(service.countUnread(1L, 1L)).isEqualTo(3L);
    }
}
