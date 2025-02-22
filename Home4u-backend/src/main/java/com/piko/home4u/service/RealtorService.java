package com.piko.home4u.service;

import com.piko.home4u.model.Realtor;
import com.piko.home4u.repository.RealtorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RealtorService {
    private final RealtorRepository realtorRepository;

    // ✅ 특정 아파트의 공인중개사 목록 조회
    public List<Realtor> getRealtorsByApartment(Long apartmentId) {
        return realtorRepository.findByApartmentId(apartmentId);
    }

    // ✅ 특정 공인중개사 이름으로 조회
    public List<Realtor> getRealtorByName(String name) {
        return realtorRepository.findByName(name);
    }

    // ✅ 특정 공인중개사 전화번호로 조회
    public Realtor getRealtorByPhoneNumber(String phoneNumber) {
        return realtorRepository.findByPhoneNumberNative(phoneNumber);
    }

    // ✅ 특정 지역(구/군)의 공인중개사 목록 조회
    public List<Realtor> getRealtorsByGungu(String gungu) {
        return realtorRepository.findByGungu(gungu);
    }

    // ✅ 특정 지역(구/군)공인중개사 개수 조회
    public Long countRealtorsGungu(String gungu) {
        return realtorRepository.countRealtorsByGungu(gungu);
    }
}