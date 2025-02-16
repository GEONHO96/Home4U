package com.piko.home4u.service;

import com.piko.home4u.dto.PropertyDto;
import com.piko.home4u.model.*;
import com.piko.home4u.repository.PropertyRepository;
import com.piko.home4u.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PropertyService {
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;

    public Property addProperty(PropertyDto propertyDto, Long ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("소유자를 찾을 수 없습니다."));

        Property property = new Property();
        property.setTitle(propertyDto.getTitle());
        property.setDescription(propertyDto.getDescription());
        property.setPrice(propertyDto.getPrice());
        property.setTransactionType(propertyDto.getTransactionType());
        property.setPropertyType(propertyDto.getPropertyType());
        property.setAddress(propertyDto.getAddress());
        property.setOwner(owner);

        return propertyRepository.save(property);
    }

    public List<Property> getAllProperties() {
        return propertyRepository.findAll();
    }

    public Property getPropertyById(Long id) {
        return propertyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("매물을 찾을 수 없습니다."));
    }

    public void deleteProperty(Long id) {
        if (!propertyRepository.existsById(id)) {
            throw new RuntimeException("삭제할 매물이 존재하지 않습니다.");
        }
        propertyRepository.deleteById(id);
    }

    public List<Property> searchProperties(String buildingType, Double minLat, Double maxLat, Double minLng, Double maxLng) {
        if (buildingType != null) {
            return propertyRepository.findByBuildingTypeAndCoordinates(buildingType, minLat, maxLat, minLng, maxLng);
        }
        return propertyRepository.findByCoordinates(minLat, maxLat, minLng, maxLng);
    }

    public List<Property> filterProperties(TransactionType transactionType, Double minArea, Double maxArea,
                                           Integer minFloor, Integer maxFloor, RoomStructure roomStructure,
                                           List<AdditionalOption> additionalOptions) {
        return propertyRepository.findByFilters(transactionType, minArea, maxArea, minFloor, maxFloor, roomStructure, additionalOptions);
    }
}