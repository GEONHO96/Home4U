package com.piko.home4u.service;

import com.piko.home4u.model.PushToken;
import com.piko.home4u.model.User;
import com.piko.home4u.model.UserRole;
import com.piko.home4u.repository.PushTokenRepository;
import com.piko.home4u.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PushServiceTest {

    @Mock private PushTokenRepository pushTokenRepository;
    @Mock private UserRepository userRepository;
    @Mock private RestTemplate restTemplate;

    @InjectMocks private PushService service;

    private User user(long id) {
        User u = new User("u" + id, "pw", id + "@x", "0", UserRole.ROLE_USER);
        u.setId(id);
        return u;
    }

    @Test
    void register_savesNewToken() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L)));
        when(pushTokenRepository.findByToken("ExpoToken[abc]")).thenReturn(Optional.empty());
        when(pushTokenRepository.save(any(PushToken.class))).thenAnswer(inv -> {
            PushToken pt = inv.getArgument(0);
            pt.setId(7L);
            return pt;
        });

        PushToken saved = service.register(1L, "ExpoToken[abc]", "ios");

        assertThat(saved.getId()).isEqualTo(7L);
        assertThat(saved.getToken()).isEqualTo("ExpoToken[abc]");
        assertThat(saved.getPlatform()).isEqualTo("ios");
    }

    @Test
    void register_updatesExistingToken() {
        PushToken existing = PushToken.builder().id(5L).token("ExpoToken[xyz]").user(user(2L)).platform("android").build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L)));
        when(pushTokenRepository.findByToken("ExpoToken[xyz]")).thenReturn(Optional.of(existing));
        when(pushTokenRepository.save(any(PushToken.class))).thenAnswer(inv -> inv.getArgument(0));

        PushToken saved = service.register(1L, "ExpoToken[xyz]", "ios");

        assertThat(saved.getId()).isEqualTo(5L); // 같은 row
        assertThat(saved.getUser().getId()).isEqualTo(1L); // 새 사용자로 갱신
        assertThat(saved.getPlatform()).isEqualTo("ios");
    }

    @Test
    void register_emptyTokenRejected() {
        assertThatThrownBy(() -> service.register(1L, "  ", "ios"))
                .hasMessageContaining("푸시 토큰");
        verify(pushTokenRepository, never()).save(any(PushToken.class));
    }

    @Test
    void sendToUser_noTokens_doesNothing() {
        when(pushTokenRepository.findByUserId(1L)).thenReturn(List.of());
        service.sendToUser(1L, "t", "b", null);
        verify(restTemplate, never()).postForEntity(any(String.class), any(), eq(String.class));
    }

    @Test
    void sendToUser_disabled_logsButSkipsHttp() {
        // pushEnabled 기본값 false → restTemplate 호출 X
        ReflectionTestUtils.setField(service, "pushEnabled", false);
        when(pushTokenRepository.findByUserId(1L)).thenReturn(List.of(
                PushToken.builder().token("ExpoToken[a]").build(),
                PushToken.builder().token("ExpoToken[b]").build()
        ));
        service.sendToUser(1L, "t", "b", null);
        verify(restTemplate, never()).postForEntity(any(String.class), any(), eq(String.class));
    }

    @Test
    void sendToUser_enabled_callsExpoOncePerToken() {
        ReflectionTestUtils.setField(service, "pushEnabled", true);
        // restTemplate() 메서드를 stub 으로 교체
        PushService spy = org.mockito.Mockito.spy(service);
        org.mockito.Mockito.doReturn(restTemplate).when(spy).restTemplate();

        when(pushTokenRepository.findByUserId(1L)).thenReturn(List.of(
                PushToken.builder().token("ExpoToken[a]").build(),
                PushToken.builder().token("ExpoToken[b]").build()
        ));

        spy.sendToUser(1L, "t", "b", null);

        verify(restTemplate, times(2)).postForEntity(
                eq("https://exp.host/--/api/v2/push/send"), any(), eq(String.class));
    }

    @Test
    void unregister_deletesToken() {
        service.unregister("ExpoToken[abc]");
        verify(pushTokenRepository).deleteByToken("ExpoToken[abc]");
    }
}
