package com.piko.home4u.service;

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

    // ✅ 아파트 상세 정보 조회
    public Optional<Apartment> getApartmentDetails(String name) {
        return apartmentRepository.findByName(name);
    }

    // ✅ 해당 아파트의 공인중개사 목록 조회
    public List<Realtor> getRealtorsForApartment(Long apartmentId) {
        return realtorRepository.findByApartmentId(apartmentId);
    }

    // ✅ 해당 아파트 주변 학교 목록 조회
    public List<School> getSchoolForApartment(Long apartmentId) {
        return schoolRepository.findByApartmentId(apartmentId);
    }
}