package com.piko.home4u.service;

import com.piko.home4u.dto.UserSignupDto;
import com.piko.home4u.model.User;
import com.piko.home4u.model.UserRole;
import com.piko.home4u.repository.UserRepository;
import com.piko.home4u.security.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtTokenProvider jwtTokenProvider;

    @InjectMocks private UserService service;

    private UserSignupDto signupDto(UserRole role) {
        UserSignupDto dto = new UserSignupDto();
        ReflectionTestUtils.setField(dto, "username", "alice");
        ReflectionTestUtils.setField(dto, "password", "pw1234");
        ReflectionTestUtils.setField(dto, "email", "a@a.com");
        ReflectionTestUtils.setField(dto, "phone", "010");
        ReflectionTestUtils.setField(dto, "role", role);
        if (role == UserRole.ROLE_REALTOR) {
            ReflectionTestUtils.setField(dto, "licenseNumber", "LIC-1");
            ReflectionTestUtils.setField(dto, "agencyName", "Agency");
        }
        return dto;
    }

    @Test
    void registerUser_hashesPasswordAndSaves() {
        when(userRepository.findByUsername("alice")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("pw1234")).thenReturn("HASHED");
        ArgumentCaptor<User> cap = ArgumentCaptor.forClass(User.class);
        when(userRepository.save(cap.capture())).thenAnswer(inv -> inv.getArgument(0));

        User saved = service.registerUser(signupDto(UserRole.ROLE_USER));

        assertThat(saved.getPassword()).isEqualTo("HASHED");
        assertThat(cap.getValue().getRole()).isEqualTo(UserRole.ROLE_USER);
        assertThat(cap.getValue().getLicenseNumber()).isNull();
    }

    @Test
    void registerUser_duplicateUsername_throws() {
        when(userRepository.findByUsername("alice"))
                .thenReturn(Optional.of(new User("alice", "h", "a@a.com", "010", UserRole.ROLE_USER)));
        assertThatThrownBy(() -> service.registerUser(signupDto(UserRole.ROLE_USER)))
                .hasMessageContaining("이미 존재");
        verify(userRepository, never()).save(any());
    }

    @Test
    void registerUser_realtor_attachesLicense() {
        when(userRepository.findByUsername("alice")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("H");
        ArgumentCaptor<User> cap = ArgumentCaptor.forClass(User.class);
        when(userRepository.save(cap.capture())).thenAnswer(inv -> inv.getArgument(0));

        service.registerUser(signupDto(UserRole.ROLE_REALTOR));

        User saved = cap.getValue();
        assertThat(saved.getRole()).isEqualTo(UserRole.ROLE_REALTOR);
        assertThat(saved.getLicenseNumber()).isEqualTo("LIC-1");
        assertThat(saved.getAgencyName()).isEqualTo("Agency");
    }

    @Test
    void login_success_returnsToken() {
        User u = new User("alice", "HASH", "a@a.com", "010", UserRole.ROLE_USER);
        u.setId(9L);
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(u));
        when(passwordEncoder.matches("pw1234", "HASH")).thenReturn(true);
        when(jwtTokenProvider.createToken("alice")).thenReturn("T");

        assertThat(service.login("alice", "pw1234")).isEqualTo("T");
    }

    @Test
    void login_wrongPassword_throws() {
        User u = new User("alice", "HASH", "a@a.com", "010", UserRole.ROLE_USER);
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(u));
        when(passwordEncoder.matches("bad", "HASH")).thenReturn(false);

        assertThatThrownBy(() -> service.login("alice", "bad"))
                .hasMessageContaining("비밀번호");
    }

    @Test
    void changePassword_requiresCurrentPassword() {
        User u = new User("alice", "OLD", "a@a.com", "010", UserRole.ROLE_USER);
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(u));
        when(passwordEncoder.matches("curr", "OLD")).thenReturn(true);
        when(passwordEncoder.encode("new-pw")).thenReturn("NEW");

        service.changePassword("alice", "curr", "new-pw");

        assertThat(u.getPassword()).isEqualTo("NEW");
        verify(userRepository).save(u);
    }

    @Test
    void changePassword_wrongCurrent_throws() {
        User u = new User("alice", "OLD", "a@a.com", "010", UserRole.ROLE_USER);
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(u));
        when(passwordEncoder.matches("bad", "OLD")).thenReturn(false);

        assertThatThrownBy(() -> service.changePassword("alice", "bad", "new"))
                .hasMessageContaining("현재 비밀번호");
        verify(userRepository, never()).save(any());
    }
}
