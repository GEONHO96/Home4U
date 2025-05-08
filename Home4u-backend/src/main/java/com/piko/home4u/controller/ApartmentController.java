package com.piko.home4u.controller;

import com.piko.home4u.dto.ConstructorHeatingDto;
import com.piko.home4u.dto.RatioDto;
import com.piko.home4u.model.Apartment;
import com.piko.home4u.model.Realtor;
import com.piko.home4u.model.School;
import com.piko.home4u.service.ApartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/apartments")
@RequiredArgsConstructor
public class ApartmentController {
    private final ApartmentService apartmentService;

    @GetMapping("/name/{name}")
    public ResponseEntity<Apartment> getByName(@PathVariable String name) {
        return apartmentService.getApartmentByName(name)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/gungu/{gungu}")
    public ResponseEntity<List<Apartment>> getByGungu(@PathVariable String gungu) {
        return ResponseEntity.ok(apartmentService.getApartmentsByGungu(gungu));
    }

    @GetMapping("/dong/{dong}")
    public ResponseEntity<List<Apartment>> getByDong(@PathVariable String dong) {
        return ResponseEntity.ok(apartmentService.getApartmentsByDong(dong));
    }

    @GetMapping("/gungu/{gungu}/count")
    public ResponseEntity<Long> countByGungu(@PathVariable String gungu) {
        return ResponseEntity.ok(apartmentService.countApartmentsInGungu(gungu));
    }

    @GetMapping("/{id}/ratios")
    public ResponseEntity<RatioDto> getRatios(@PathVariable Long id) {
        return ResponseEntity.ok(apartmentService.getRatiosById(id));
    }

    @GetMapping("/{id}/constructor-heating")
    public ResponseEntity<ConstructorHeatingDto> getConstructorHeating(@PathVariable Long id) {
        return ResponseEntity.ok(apartmentService.getConstructorHeatingById(id));
    }

    @GetMapping("/{apartmentId}/relators")
    public ResponseEntity<List<Realtor>> getRelators(@PathVariable Long apartmentId) {
        return ResponseEntity.ok(apartmentService.getRealtorsForApartment(apartmentId));
    }

    @GetMapping("/{apartmentId}/schools")
    public ResponseEntity<List<School>> getSchools(@PathVariable Long apartmentId) {
        return ResponseEntity.ok(apartmentService.getSchoolsForApartment(apartmentId));
    }
}