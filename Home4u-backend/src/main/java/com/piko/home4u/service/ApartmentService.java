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
}