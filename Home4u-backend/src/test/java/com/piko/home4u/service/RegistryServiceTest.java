package com.piko.home4u.service;

import com.piko.home4u.model.Property;
import com.piko.home4u.model.User;
import com.piko.home4u.model.UserRole;
import com.piko.home4u.repository.PropertyRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RegistryServiceTest {

    @Mock private PropertyRepository propertyRepository;

    @InjectMocks private RegistryService service;

    private Property property(long id, long ownerId) {
        Property p = new Property();
        p.setId(id);
        p.setAddress("서울 강남구 대치동");
        User owner = new User("홍길동", "pw", "x@x", "0", UserRole.ROLE_REALTOR);
        owner.setId(ownerId);
        p.setOwner(owner);
        return p;
    }

    @Test
    void isLive_falseWhenKeyMissing() {
        ReflectionTestUtils.setField(service, "apiKey", "");
        assertThat(service.isLive()).isFalse();
    }

    @Test
    void isLive_trueWhenKeyConfigured() {
        ReflectionTestUtils.setField(service, "apiKey", "secret-key");
        assertThat(service.isLive()).isTrue();
    }

    @Test
    void lookup_evenIdReturnsClean() {
        when(propertyRepository.findById(2L)).thenReturn(Optional.of(property(2L, 5L)));
        RegistryService.RegistryReport r = service.lookup(2L);
        assertThat(r.isClean()).isTrue();
        assertThat(r.getLiens()).isZero();
        assertThat(r.getSource()).isEqualTo("stub");
    }

    @Test
    void lookup_oddIdReturnsCaution() {
        when(propertyRepository.findById(1L)).thenReturn(Optional.of(property(1L, 5L)));
        RegistryService.RegistryReport r = service.lookup(1L);
        assertThat(r.isClean()).isFalse();
        assertThat(r.getLiens()).isEqualTo(1);
    }

    @Test
    void lookup_masksOwnerName() {
        when(propertyRepository.findById(2L)).thenReturn(Optional.of(property(2L, 5L)));
        RegistryService.RegistryReport r = service.lookup(2L);
        assertThat(r.getOwnerNameMasked()).startsWith("홍").endsWith("동").contains("*");
    }

    @Test
    void lookup_unknownPropertyThrows() {
        when(propertyRepository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.lookup(99L))
                .hasMessageContaining("매물");
    }
}
