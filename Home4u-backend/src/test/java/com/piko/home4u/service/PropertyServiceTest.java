package com.piko.home4u.service;

import com.piko.home4u.dto.PropertyDto;
import com.piko.home4u.model.Property;
import com.piko.home4u.model.PropertyType;
import com.piko.home4u.model.Transaction;
import com.piko.home4u.model.TransactionStatus;
import com.piko.home4u.model.TransactionType;
import com.piko.home4u.model.User;
import com.piko.home4u.model.UserRole;
import com.piko.home4u.repository.PropertyRepository;
import com.piko.home4u.repository.TransactionRepository;
import com.piko.home4u.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
class PropertyServiceTest {

    @Mock private PropertyRepository propertyRepository;
    @Mock private UserRepository userRepository;
    @Mock private TransactionRepository transactionRepository;

    @InjectMocks private PropertyService service;

    private User realtor(long id) {
        User u = new User("realtor" + id, "pw", "r" + id + "@x", "010", UserRole.ROLE_REALTOR);
        u.setId(id);
        return u;
    }

    private Property owned(long id, User owner) {
        Property p = new Property();
        p.setId(id);
        p.setOwner(owner);
        p.setViews(0);
        p.setSold(false);
        return p;
    }

    private PropertyDto basicDto() {
        return new PropertyDto(
                "title",
                "desc",
                42000,
                PropertyType.APARTMENT,
                TransactionType.SALE,
                "Seoul",
                37.5, 127.0,
                "dong", "gungu",
                5,
                40.0, 60.0,
                null,
                null,
                null
        );
    }

    @Test
    void createProperty_setsOwnerAndSavesAsUnsold() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(realtor(1L)));
        when(propertyRepository.save(any(Property.class))).thenAnswer(inv -> {
            Property p = inv.getArgument(0);
            p.setId(77L);
            return p;
        });

        Property p = service.createProperty(basicDto(), 1L);

        assertThat(p.getId()).isEqualTo(77L);
        assertThat(p.isSold()).isFalse();
        assertThat(p.getOwner().getId()).isEqualTo(1L);
        assertThat(p.getPrice()).isEqualTo(42000);
    }

    @Test
    void createProperty_unknownOwner_throws() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.createProperty(basicDto(), 99L))
                .hasMessageContaining("소유자");
    }

    @Test
    void incrementViews_persistsIncremented() {
        Property p = owned(1L, realtor(10L));
        p.setViews(3);
        when(propertyRepository.save(p)).thenReturn(p);

        service.incrementViews(p);

        assertThat(p.getViews()).isEqualTo(4);
        verify(propertyRepository).save(p);
    }

    @Test
    void updateProperty_allowsOwner() {
        User owner = realtor(10L);
        Property p = owned(1L, owner);
        when(propertyRepository.findById(1L)).thenReturn(Optional.of(p));
        when(propertyRepository.save(any(Property.class))).thenAnswer(inv -> inv.getArgument(0));

        PropertyDto dto = basicDto();
        Property updated = service.updateProperty(1L, 10L, dto);

        assertThat(updated.getTitle()).isEqualTo("title");
        assertThat(updated.getPrice()).isEqualTo(42000);
    }

    @Test
    void updateProperty_rejectsNonOwner() {
        Property p = owned(1L, realtor(10L));
        when(propertyRepository.findById(1L)).thenReturn(Optional.of(p));

        assertThatThrownBy(() -> service.updateProperty(1L, 99L, basicDto()))
                .hasMessageContaining("본인");
        verify(propertyRepository, never()).save(any(Property.class));
    }

    @Test
    void requestTransaction_setsSellerToOwnerAndPending() {
        User owner = realtor(10L);
        User buyer = new User("buyer", "pw", "b@x", "010", UserRole.ROLE_USER);
        buyer.setId(20L);
        Property p = owned(1L, owner);
        when(propertyRepository.findById(1L)).thenReturn(Optional.of(p));
        when(userRepository.findById(20L)).thenReturn(Optional.of(buyer));
        ArgumentCaptor<Transaction> cap = ArgumentCaptor.forClass(Transaction.class);
        when(transactionRepository.save(cap.capture())).thenAnswer(inv -> inv.getArgument(0));

        service.requestTransaction(1L, 20L);

        Transaction t = cap.getValue();
        assertThat(t.getStatus()).isEqualTo(TransactionStatus.PENDING);
        assertThat(t.getBuyer().getId()).isEqualTo(20L);
        assertThat(t.getSeller().getId()).isEqualTo(10L);
        assertThat(t.getProperty().getId()).isEqualTo(1L);
    }

    @Test
    void approveTransaction_flipsStatusAndSoldAndSavesBoth() {
        Property p = owned(1L, realtor(10L));
        Transaction t = Transaction.builder().id(7L).property(p).status(TransactionStatus.PENDING).build();
        when(transactionRepository.findById(7L)).thenReturn(Optional.of(t));

        service.approveTransaction(7L);

        assertThat(t.getStatus()).isEqualTo(TransactionStatus.APPROVED);
        assertThat(p.isSold()).isTrue();
        verify(transactionRepository).save(t);
        verify(propertyRepository).save(p);
    }

    @Test
    void rejectTransaction_changesStatusButLeavesSoldFalse() {
        Property p = owned(1L, realtor(10L));
        Transaction t = Transaction.builder().id(8L).property(p).status(TransactionStatus.PENDING).build();
        when(transactionRepository.findById(8L)).thenReturn(Optional.of(t));

        service.rejectTransaction(8L);

        assertThat(t.getStatus()).isEqualTo(TransactionStatus.REJECTED);
        assertThat(p.isSold()).isFalse();
        verify(transactionRepository).save(t);
        verify(propertyRepository, never()).save(p);
    }

    @Test
    void getPropertiesByOwner_delegatesToRepository() {
        when(propertyRepository.findByOwnerIdOrderByIdDesc(10L))
                .thenReturn(List.of(owned(1L, realtor(10L)), owned(2L, realtor(10L))));

        assertThat(service.getPropertiesByOwner(10L)).hasSize(2);
    }
}
