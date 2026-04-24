package com.piko.home4u.service;

import com.piko.home4u.dto.RealtorDto;
import com.piko.home4u.model.Apartment;
import com.piko.home4u.model.Realtor;
import com.piko.home4u.repository.ApartmentRepository;
import com.piko.home4u.repository.RealtorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RealtorService {
    private final RealtorRepository realtorRepository;
    private final ApartmentRepository apartmentRepository;

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

    // ✅ 등록
    public Realtor createRealtor(RealtorDto dto) {
        Apartment apt = apartmentRepository.findById(dto.getApartmentId())
                .orElseThrow(() -> new RuntimeException("아파트를 찾을 수 없습니다."));
        Realtor r = Realtor.builder()
                .apartment(apt)
                .name(dto.getName())
                .phoneNumber(dto.getPhoneNumber())
                .address(dto.getAddress())
                .latitude(dto.getLatitude() == null ? 0.0 : dto.getLatitude())
                .longitude(dto.getLongitude() == null ? 0.0 : dto.getLongitude())
                .build();
        return realtorRepository.save(r);
    }

    // ✅ 수정 — null 이 아닌 필드만 교체
    public Realtor updateRealtor(Long id, RealtorDto dto) {
        Realtor r = realtorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("중개업자를 찾을 수 없습니다."));
        if (dto.getApartmentId() != null) {
            Apartment apt = apartmentRepository.findById(dto.getApartmentId())
                    .orElseThrow(() -> new RuntimeException("아파트를 찾을 수 없습니다."));
            r.setApartment(apt);
        }
        if (dto.getName() != null) r.setName(dto.getName());
        if (dto.getPhoneNumber() != null) r.setPhoneNumber(dto.getPhoneNumber());
        if (dto.getAddress() != null) r.setAddress(dto.getAddress());
        if (dto.getLatitude() != null) r.setLatitude(dto.getLatitude());
        if (dto.getLongitude() != null) r.setLongitude(dto.getLongitude());
        return realtorRepository.save(r);
    }

    // ✅ 삭제
    public void deleteRealtor(Long id) {
        if (!realtorRepository.existsById(id)) {
            throw new RuntimeException("삭제할 중개업자가 존재하지 않습니다.");
        }
        realtorRepository.deleteById(id);
    }
}
