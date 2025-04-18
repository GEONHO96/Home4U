package com.piko.home4u;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.piko.home4u.controller.*;
import com.piko.home4u.dto.LoginDto;
import com.piko.home4u.dto.UserSignupDto;
import com.piko.home4u.model.*;
import com.piko.home4u.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.context.MessageSource;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class Home4UTests {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper = new ObjectMapper();

    @Mock private ApartmentService apartmentService;
    @Mock private PropertyService propertyService;
    @Mock private UserService userService;
    @Mock private ReviewService reviewService;
    @Mock private RealtorService realtorService;
    @Mock private MessageSource messageSource;

    @InjectMocks private ApartmentController apartmentController;
    @InjectMocks private PropertyController propertyController;
    @InjectMocks private UserController userController;
    @InjectMocks private ReviewController reviewController;
    @InjectMocks private RealtorController realtorController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        this.mockMvc = MockMvcBuilders
                .standaloneSetup(
                        apartmentController,
                        propertyController,
                        userController,
                        reviewController,
                        realtorController
                )
                .setMessageConverters(new MappingJackson2HttpMessageConverter())
                .build();
    }

    @Test
    void testGetApartmentDetails() throws Exception {
        // 1) given: stub
        Apartment apt = new Apartment();
        apt.setName("LuxuryApt");
        when(apartmentService.getApartmentDetails(anyString()))
                .thenReturn(Optional.of(apt));

        // 2) when & then
        mockMvc.perform(get("/apartments/name/{name}", "LuxuryApt"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("LuxuryApt"));
    }

    @Test
    void testGetPropertyById() throws Exception {
        Property property = new Property();
        property.setId(1L);
        property.setTitle("Modern Condo");
        when(propertyService.getPropertyById(anyLong())).thenReturn(property);

        mockMvc.perform(get("/properties/{id}", 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Modern Condo"));
    }

    @Test
    void testRegisterUser() throws Exception {
        // service.registerUser는 void 메서드라 stub이 필요 없습니다

        UserSignupDto dto = new UserSignupDto();
        dto.setUsername("john");
        dto.setPassword("pw");
        dto.setEmail("a@b.com");
        dto.setPhone("010");
        dto.setRole(UserRole.ROLE_USER);

        mockMvc.perform(post("/users/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("회원 가입 성공"));
    }

    @Test
    void testLogin() throws Exception {
        when(userService.login(anyString(), anyString()))
                .thenReturn("fake-jwt-token");

        LoginDto dto = new LoginDto();
        dto.setUsername("john_doe");
        dto.setPassword("password");

        mockMvc.perform(post("/users/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("fake-jwt-token"));
    }

    @Test
    void testAddReview() throws Exception {
        Review review = new Review();
        review.setId(1L);
        when(reviewService.addReview(anyLong(), anyLong(), anyInt(), anyString()))
                .thenReturn(review);

        mockMvc.perform(post("/reviews")
                        .param("propertyId", "1")
                        .param("userId", "2")
                        .param("rating", "5")
                        .param("comment", "Great place"))
                .andExpect(status().isOk());
    }

    @Test
    void testGetRealtorsByApartment() throws Exception {
        Realtor realtor = new Realtor();
        realtor.setId(1L);
        realtor.setName("Top Realtor");
        when(realtorService.getRealtorsByApartment(anyLong()))
                .thenReturn(List.of(realtor));

        mockMvc.perform(get("/realtors/apartment/{id}", 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Top Realtor"));
    }
}