package com.piko.home4u;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.piko.home4u.controller.*;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.context.MessageSource;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class Home4UTests {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private ApartmentService apartmentService;
    @Mock
    private PropertyService propertyService;
    @Mock
    private UserService userService;
    @Mock
    private ReviewService reviewService;
    @Mock
    private RealtorService realtorService;
    @Mock
    private MessageSource messageSource; // ✅ MessageSource 추가

    @InjectMocks
    private ApartmentController apartmentController;
    @InjectMocks
    private PropertyController propertyController;
    @InjectMocks
    private UserController userController;
    @InjectMocks
    private ReviewController reviewController;
    @InjectMocks
    private RealtorController realtorController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        this.mockMvc = MockMvcBuilders.standaloneSetup(
                apartmentController, propertyController, userController, reviewController, realtorController
        ).build();
    }

    // ✅ ApartmentController 테스트
    @Test
    void testGetApartmentDetails() throws Exception {
        Apartment apartment = new Apartment();
        apartment.setId(1L);
        apartment.setName("Luxury Apt");

        when(apartmentService.getApartmentDetails(anyString())).thenReturn(Optional.of(apartment));

        mockMvc.perform(get("/apartments/Luxury%20Apt")) // ✅ URL 인코딩
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Luxury Apt"));
    }

    // ✅ PropertyController 테스트
    @Test
    void testGetPropertyById() throws Exception {
        Property property = new Property();
        property.setId(1L);
        property.setTitle("Modern Condo");

        when(propertyService.getPropertyById(anyLong())).thenReturn(property);

        mockMvc.perform(get("/properties/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Modern Condo"));
    }

    // ✅ UserController 테스트
    @Test
    void testRegisterUser() throws Exception {
        User user = new User("john_doe", "password", "john@example.com", "01012345678", UserRole.ROLE_USER);
        when(userService.registerUser(any())).thenReturn(user);

        mockMvc.perform(post("/users/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(user)))
                .andExpect(status().isOk());
    }

    @Test
    void testLogin() throws Exception {
        when(userService.login(anyString(), anyString())).thenReturn("fake-jwt-token");

        mockMvc.perform(post("/users/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\": \"john_doe\", \"password\": \"password\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("fake-jwt-token"));
    }

    // ✅ ReviewController 테스트
    @Test
    void testAddReview() throws Exception {
        Review review = new Review();
        review.setId(1L);
        review.setComment("Great place");
        review.setRating(5);

        when(reviewService.addReview(anyLong(), anyLong(), anyInt(), anyString())).thenReturn(review);

        mockMvc.perform(post("/reviews")
                        .param("propertyId", "1")
                        .param("userId", "2")
                        .param("rating", "5")
                        .param("comment", "Great place"))
                .andExpect(status().isOk());
    }

    // ✅ RealtorController 테스트
    @Test
    void testGetRealtorsByApartment() throws Exception {
        Realtor realtor = new Realtor();
        realtor.setId(1L);
        realtor.setName("Top Realtor");

        when(realtorService.getRealtorsByApartment(anyLong())).thenReturn(List.of(realtor));

        mockMvc.perform(get("/realtors/apartment/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Top Realtor"));
    }
}
