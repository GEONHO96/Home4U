package com.piko.home4u;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.piko.home4u.controller.ApartmentController;
import com.piko.home4u.controller.OAuthController;
import com.piko.home4u.controller.PropertyController;
import com.piko.home4u.controller.RealtorController;
import com.piko.home4u.controller.ReviewController;
import com.piko.home4u.controller.UserController;
import com.piko.home4u.dto.LoginDto;
import com.piko.home4u.dto.UserSignupDto;
import com.piko.home4u.model.Apartment;
import com.piko.home4u.model.Property;
import com.piko.home4u.model.Realtor;
import com.piko.home4u.model.Review;
import com.piko.home4u.model.TransactionType;
import com.piko.home4u.model.UserRole;
import com.piko.home4u.service.ApartmentService;
import com.piko.home4u.service.OAuthService;
import com.piko.home4u.service.PropertyService;
import com.piko.home4u.service.RealtorService;
import com.piko.home4u.service.ReviewService;
import com.piko.home4u.service.UserService;
import org.springframework.test.util.ReflectionTestUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.MessageSource;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Home4U 주요 컨트롤러 단위 테스트.
 * <p>
 * MockitoExtension 이 @Mock / @InjectMocks 를 초기화하므로,
 * 별도로 MockitoAnnotations.openMocks 를 호출하지 않는다.
 * (이중 초기화 시 @InjectMocks 가 과거 mock 을 붙들어 stub 이 적용되지 않는다.)
 */
@ExtendWith(MockitoExtension.class)
class Home4UTests {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock private ApartmentService apartmentService;
    @Mock private PropertyService propertyService;
    @Mock private UserService userService;
    @Mock private ReviewService reviewService;
    @Mock private RealtorService realtorService;
    @Mock private OAuthService oAuthService;
    @Mock private MessageSource messageSource;

    @InjectMocks private ApartmentController apartmentController;
    @InjectMocks private PropertyController propertyController;
    @InjectMocks private UserController userController;
    @InjectMocks private ReviewController reviewController;
    @InjectMocks private RealtorController realtorController;
    @InjectMocks private OAuthController oAuthController;

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders
                .standaloneSetup(
                        apartmentController,
                        propertyController,
                        userController,
                        reviewController,
                        oAuthController,
                        realtorController
                )
                .setMessageConverters(new MappingJackson2HttpMessageConverter())
                .build();
    }

    @Test
    void getApartmentByName_returnsApartment() throws Exception {
        Apartment apt = new Apartment();
        apt.setName("LuxuryApt");
        when(apartmentService.getApartmentByName("LuxuryApt"))
                .thenReturn(Optional.of(apt));

        mockMvc.perform(get("/apartments/name/{name}", "LuxuryApt"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("LuxuryApt"));
    }

    @Test
    void getPropertyById_returnsLocalizedDto() throws Exception {
        Property property = new Property();
        property.setId(1L);
        property.setTitle("Modern Condo");
        property.setDescription("desc");
        property.setPrice(1000);
        property.setAddress("Seoul");
        property.setTransactionType(TransactionType.SALE);

        when(propertyService.getPropertyById(1L)).thenReturn(property);
        // 컨트롤러가 다국어 키 5 개를 MessageSource 로 조회하므로 하나의 matcher 로 stub
        when(messageSource.getMessage(anyString(), any(), any())).thenReturn("label");

        mockMvc.perform(get("/properties/{id}", 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Modern Condo"))
                .andExpect(jsonPath("$.localizedMessages.title").value("label"));
    }

    @Test
    void registerUser_returnsSuccessMessage() throws Exception {
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
    void login_returnsJwtToken() throws Exception {
        when(userService.login("john_doe", "password"))
                .thenReturn("fake-jwt-token");

        com.piko.home4u.model.User loggedIn = new com.piko.home4u.model.User(
                "john_doe", "pw", "j@d.com", "010", UserRole.ROLE_USER);
        loggedIn.setId(99L);
        when(userService.getUserByUsername("john_doe")).thenReturn(Optional.of(loggedIn));

        LoginDto dto = new LoginDto();
        dto.setUsername("john_doe");
        dto.setPassword("password");

        mockMvc.perform(post("/users/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("fake-jwt-token"))
                .andExpect(jsonPath("$.userId").value(99))
                .andExpect(jsonPath("$.role").value("ROLE_USER"));
    }

    @Test
    void createReview_returnsReviewId() throws Exception {
        Review review = new Review();
        review.setId(1L);
        when(reviewService.createReview(anyLong(), anyLong(), anyInt(), anyString()))
                .thenReturn(review);

        mockMvc.perform(post("/reviews")
                        .param("propertyId", "1")
                        .param("userId", "2")
                        .param("rating", "5")
                        .param("comment", "Great place"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reviewId").value(1));
    }

    @Test
    void getRealtorsByApartment_returnsList() throws Exception {
        Realtor realtor = new Realtor();
        realtor.setId(1L);
        realtor.setName("Top Realtor");
        when(realtorService.getRealtorsByApartment(1L))
                .thenReturn(List.of(realtor));

        mockMvc.perform(get("/realtors/apartment/{id}", 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Top Realtor"));
    }

    // ---- OAuth authorize-url ----

    @Test
    void oauthAuthorizeUrl_whenNotConfigured_returnsConfiguredFalse() throws Exception {
        // @Value 필드는 기본값이 빈 문자열이므로 설정을 주입하지 않음
        mockMvc.perform(get("/oauth/{provider}/authorize-url", "google"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.provider").value("google"))
                .andExpect(jsonPath("$.configured").value(false))
                .andExpect(jsonPath("$.url").value(""));
    }

    @Test
    void oauthAuthorizeUrl_whenConfigured_returnsProviderUrl() throws Exception {
        ReflectionTestUtils.setField(oAuthController, "naverClientId", "test-client-id");
        ReflectionTestUtils.setField(oAuthController, "naverRedirectUri", "http://localhost:5173/oauth/naver/callback");

        mockMvc.perform(get("/oauth/{provider}/authorize-url", "naver"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.provider").value("naver"))
                .andExpect(jsonPath("$.configured").value(true))
                .andExpect(jsonPath("$.url").value(org.hamcrest.Matchers.startsWith(
                        "https://nid.naver.com/oauth2.0/authorize")))
                .andExpect(jsonPath("$.url").value(org.hamcrest.Matchers.containsString(
                        "client_id=test-client-id")))
                .andExpect(jsonPath("$.url").value(org.hamcrest.Matchers.containsString(
                        "redirect_uri=")));
    }
}
