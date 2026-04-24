package com.piko.home4u.service;

import com.piko.home4u.dto.ConstructorHeatingDto;
import com.piko.home4u.dto.RatioDto;
import com.piko.home4u.model.Apartment;
import com.piko.home4u.model.Realtor;
import com.piko.home4u.model.School;
import com.piko.home4u.repository.ApartmentRepository;
import com.piko.home4u.repository.RealtorRepository;
import com.piko.home4u.repository.SchoolRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ApartmentService {
    private final ApartmentRepository apartmentRepository;
    private final RealtorRepository realtorRepository;
    private final SchoolRepository schoolRepository;

    // ✅ 특정 아파트 이름으로 조회
    public Optional<Apartment> getApartmentByName(String name) {
        return apartmentRepository.findByName(name);
    }

    // ✅ 특정 구/군 내 모든 아파트 조회
    public List<Apartment> getApartmentsByGungu(String gungu) {
        return apartmentRepository.findByGungu(gungu);
    }

    // ✅ 특정 동 내 아파트 조회
    public List<Apartment> getApartmentsByDong(String dong) {
        return apartmentRepository.findByDong(dong);
    }

    // ✅ 특정 지역 내 아파트 개수 조회
    public Long countApartmentsInGungu(String gungu) {
        return apartmentRepository.countByGungu(gungu);
    }

    // ✅ 특정 아파트의 용적률과 건폐율 조회
    public RatioDto getRatiosById(Long id) {
        return apartmentRepository.fetchRatiosById(id);
    }

    // ✅ 특정 아파트의 시공사 및 난방 방식 조회
    public ConstructorHeatingDto getConstructorHeatingById(Long id) {
        return apartmentRepository.fetchConstructorHeatingById(id);
    }

    // ✅ 아파트 상세 정보 조회
    public Optional<Apartment> getApartmentDetails(String name) {
        return apartmentRepository.findByName(name);
    }

    // ✅ 해당 아파트의 공인중개사 목록 조회
    public List<Realtor> getRealtorsForApartment(Long apartmentId) {
        return realtorRepository.findByApartmentId(apartmentId);
    }

    // ✅ 해당 아파트 주변 학교 목록 조회
    public List<School> getSchoolsForApartment(Long apartmentId) {
        return schoolRepository.findByApartmentId(apartmentId);
    }

    // ✅ 아파트 등록
    public Apartment createApartment(com.piko.home4u.dto.ApartmentDto dto) {
        Apartment apt = Apartment.builder()
                .name(dto.getName())
                .address(dto.getAddress())
                .gungu(dto.getGungu())
                .dong(dto.getDong())
                .totalUnits(or0(dto.getTotalUnits()))
                .totalBuildings(or0(dto.getTotalBuildings()))
                .totalFloors(or0(dto.getTotalFloors()))
                .approvalDate(dto.getApprovalDate())
                .totalParking(or0(dto.getTotalParking()))
                .floorAreaRatio(orDouble0(dto.getFloorAreaRatio()))
                .buildingCoverageRatio(orDouble0(dto.getBuildingCoverageRatio()))
                .constructor(dto.getConstructor())
                .heatingType(dto.getHeatingType())
                .latitude(orDouble0(dto.getLatitude()))
                .longitude(orDouble0(dto.getLongitude()))
                .areaSizes(dto.getAreaSizes())
                .build();
        return apartmentRepository.save(apt);
    }

    // ✅ 아파트 수정 — null 이 아닌 필드만 패치
    public Apartment updateApartment(Long id, com.piko.home4u.dto.ApartmentDto dto) {
        Apartment apt = apartmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("아파트를 찾을 수 없습니다."));
        if (dto.getName() != null) apt.setName(dto.getName());
        if (dto.getAddress() != null) apt.setAddress(dto.getAddress());
        if (dto.getGungu() != null) apt.setGungu(dto.getGungu());
        if (dto.getDong() != null) apt.setDong(dto.getDong());
        if (dto.getTotalUnits() != null) apt.setTotalUnits(dto.getTotalUnits());
        if (dto.getTotalBuildings() != null) apt.setTotalBuildings(dto.getTotalBuildings());
        if (dto.getTotalFloors() != null) apt.setTotalFloors(dto.getTotalFloors());
        if (dto.getApprovalDate() != null) apt.setApprovalDate(dto.getApprovalDate());
        if (dto.getTotalParking() != null) apt.setTotalParking(dto.getTotalParking());
        if (dto.getFloorAreaRatio() != null) apt.setFloorAreaRatio(dto.getFloorAreaRatio());
        if (dto.getBuildingCoverageRatio() != null) apt.setBuildingCoverageRatio(dto.getBuildingCoverageRatio());
        if (dto.getConstructor() != null) apt.setConstructor(dto.getConstructor());
        if (dto.getHeatingType() != null) apt.setHeatingType(dto.getHeatingType());
        if (dto.getLatitude() != null) apt.setLatitude(dto.getLatitude());
        if (dto.getLongitude() != null) apt.setLongitude(dto.getLongitude());
        if (dto.getAreaSizes() != null) apt.setAreaSizes(dto.getAreaSizes());
        return apartmentRepository.save(apt);
    }

    // ✅ 아파트 삭제
    public void deleteApartment(Long id) {
        if (!apartmentRepository.existsById(id)) {
            throw new RuntimeException("삭제할 아파트가 존재하지 않습니다.");
        }
        apartmentRepository.deleteById(id);
    }

    private static int or0(Integer v) { return v == null ? 0 : v; }
    private static double orDouble0(Double v) { return v == null ? 0.0 : v; }
}