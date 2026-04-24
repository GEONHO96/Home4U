package com.piko.home4u.service;

import com.piko.home4u.dto.SavedSearchDto;
import com.piko.home4u.model.Property;
import com.piko.home4u.model.PropertyType;
import com.piko.home4u.model.RoomStructure;
import com.piko.home4u.model.SavedSearch;
import com.piko.home4u.model.TransactionType;
import com.piko.home4u.model.User;
import com.piko.home4u.model.UserRole;
import com.piko.home4u.repository.PropertyRepository;
import com.piko.home4u.repository.SavedSearchRepository;
import com.piko.home4u.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SavedSearchServiceTest {

    @Mock private SavedSearchRepository savedSearchRepository;
    @Mock private UserRepository userRepository;
    @Mock private PropertyRepository propertyRepository;

    @InjectMocks private SavedSearchService service;

    private User user(long id) {
        User u = new User("u" + id, "pw", "e" + id + "@x", "010", UserRole.ROLE_USER);
        u.setId(id);
        return u;
    }

    private Property p(long id, TransactionType tt, int floor,
                       double minArea, double maxArea,
                       double lat, double lng, String title) {
        Property p = new Property();
        p.setId(id);
        p.setTitle(title);
        p.setAddress("Seoul");
        p.setPropertyType(PropertyType.APARTMENT);
        p.setTransactionType(tt);
        p.setFloor(floor);
        p.setMinArea(minArea);
        p.setMaxArea(maxArea);
        p.setLatitude(lat);
        p.setLongitude(lng);
        p.setGungu("Gangnam-gu");
        p.setDong("Yeoksam");
        return p;
    }

    @Test
    void save_defaultNameWhenBlank() {
        SavedSearchDto dto = SavedSearchDto.builder().userId(1L).name("   ").build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L)));
        when(savedSearchRepository.save(any(SavedSearch.class))).thenAnswer(inv -> {
            SavedSearch s = inv.getArgument(0);
            s.setId(10L);
            return s;
        });

        SavedSearch s = service.save(dto);

        assertThat(s.getId()).isEqualTo(10L);
        assertThat(s.getName()).isEqualTo("내 검색");
        assertThat(s.getUser().getId()).isEqualTo(1L);
    }

    @Test
    void delete_onlyOwner() {
        SavedSearch s = SavedSearch.builder().id(1L).user(user(10L)).name("x").build();
        when(savedSearchRepository.findById(1L)).thenReturn(Optional.of(s));

        service.delete(1L, 10L);

        verify(savedSearchRepository).delete(s);
    }

    @Test
    void delete_rejectsOtherUser() {
        SavedSearch s = SavedSearch.builder().id(1L).user(user(10L)).name("x").build();
        when(savedSearchRepository.findById(1L)).thenReturn(Optional.of(s));

        assertThatThrownBy(() -> service.delete(1L, 99L))
                .hasMessageContaining("본인");
        verify(savedSearchRepository, never()).delete(any(SavedSearch.class));
    }

    @Test
    void runMatch_filtersByAllFields() {
        SavedSearch s = SavedSearch.builder()
                .id(1L).user(user(1L)).name("강남 매매 투룸")
                .transactionType(TransactionType.SALE)
                .roomStructure(null)
                .minArea(20.0).maxArea(100.0)
                .minFloor(1).maxFloor(20)
                .minLat(37.4).maxLat(37.6)
                .minLng(127.0).maxLng(127.1)
                .keyword("강남")
                .build();
        when(savedSearchRepository.findById(1L)).thenReturn(Optional.of(s));

        Property matching = p(10L, TransactionType.SALE, 5, 30, 60, 37.5, 127.05, "강남 매물");
        Property wrongTx = p(11L, TransactionType.JEONSE, 5, 30, 60, 37.5, 127.05, "강남 전세");
        Property outOfMap = p(12L, TransactionType.SALE, 5, 30, 60, 38.0, 127.5, "분당");
        Property outOfArea = p(13L, TransactionType.SALE, 5, 10, 18, 37.5, 127.05, "강남 원룸");
        Property wrongKw = p(14L, TransactionType.SALE, 5, 30, 60, 37.5, 127.05, "마포");

        when(propertyRepository.findAll()).thenReturn(List.of(matching, wrongTx, outOfMap, outOfArea, wrongKw));

        List<Property> result = service.runMatch(1L);

        assertThat(result).extracting(Property::getId).containsExactly(10L);
    }

    @Test
    void listMy_delegatesToRepo() {
        when(savedSearchRepository.findByUserIdOrderByCreatedAtDesc(1L))
                .thenReturn(List.of(SavedSearch.builder().id(1L).build()));

        assertThat(service.listMy(1L)).hasSize(1);
    }

    @Test
    void runMatch_unknownId_throws() {
        when(savedSearchRepository.findById(404L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.runMatch(404L))
                .hasMessageContaining("저장된 검색");
    }
}
