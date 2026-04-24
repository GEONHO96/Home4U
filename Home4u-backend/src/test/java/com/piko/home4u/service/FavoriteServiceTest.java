package com.piko.home4u.service;

import com.piko.home4u.model.Favorite;
import com.piko.home4u.model.Property;
import com.piko.home4u.model.User;
import com.piko.home4u.model.UserRole;
import com.piko.home4u.repository.FavoriteRepository;
import com.piko.home4u.repository.PropertyRepository;
import com.piko.home4u.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FavoriteServiceTest {

    @Mock private FavoriteRepository favoriteRepository;
    @Mock private UserRepository userRepository;
    @Mock private PropertyRepository propertyRepository;

    @InjectMocks private FavoriteService service;

    private User user(long id) {
        User u = new User("u" + id, "pw", "e" + id + "@x", "010", UserRole.ROLE_USER);
        u.setId(id);
        return u;
    }
    private Property property(long id) {
        Property p = new Property();
        p.setId(id);
        return p;
    }

    @Test
    void add_createsNewRowWhenNotExists() {
        when(favoriteRepository.findByUserIdAndPropertyId(1L, 10L)).thenReturn(Optional.empty());
        when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L)));
        when(propertyRepository.findById(10L)).thenReturn(Optional.of(property(10L)));
        when(favoriteRepository.save(any(Favorite.class))).thenAnswer(inv -> {
            Favorite f = inv.getArgument(0);
            f.setId(100L);
            return f;
        });

        Favorite f = service.add(1L, 10L);

        assertThat(f.getId()).isEqualTo(100L);
        assertThat(f.getUser().getId()).isEqualTo(1L);
        assertThat(f.getProperty().getId()).isEqualTo(10L);
    }

    @Test
    void add_isIdempotent_returnsExistingWithoutSave() {
        Favorite existing = Favorite.builder().id(77L).user(user(1L)).property(property(10L)).build();
        when(favoriteRepository.findByUserIdAndPropertyId(1L, 10L)).thenReturn(Optional.of(existing));

        Favorite f = service.add(1L, 10L);

        assertThat(f.getId()).isEqualTo(77L);
        verify(favoriteRepository, never()).save(any());
        verify(userRepository, never()).findById(any());
    }

    @Test
    void remove_deletesWhenExists() {
        Favorite existing = Favorite.builder().id(1L).user(user(1L)).property(property(10L)).build();
        when(favoriteRepository.findByUserIdAndPropertyId(1L, 10L)).thenReturn(Optional.of(existing));

        service.remove(1L, 10L);

        verify(favoriteRepository, times(1)).delete(existing);
    }

    @Test
    void remove_silentWhenAbsent() {
        when(favoriteRepository.findByUserIdAndPropertyId(1L, 10L)).thenReturn(Optional.empty());

        service.remove(1L, 10L);

        verify(favoriteRepository, never()).delete(any(Favorite.class));
    }

    @Test
    void isFavorited_delegatesToExists() {
        when(favoriteRepository.existsByUserIdAndPropertyId(1L, 10L)).thenReturn(true);
        assertThat(service.isFavorited(1L, 10L)).isTrue();
    }

    @Test
    void countForProperty_delegatesToCount() {
        when(favoriteRepository.countByPropertyId(10L)).thenReturn(42L);
        assertThat(service.countForProperty(10L)).isEqualTo(42L);
    }
}
