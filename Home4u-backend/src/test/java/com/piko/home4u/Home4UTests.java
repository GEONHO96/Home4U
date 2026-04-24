package com.piko.home4u;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.piko.home4u.controller.ApartmentController;
import com.piko.home4u.controller.FavoriteController;
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
import com.piko.home4u.model.PropertyType;
import com.piko.home4u.model.Transaction;
import com.piko.home4u.model.TransactionStatus;
import com.piko.home4u.model.TransactionType;
import com.piko.home4u.model.UserRole;
import com.piko.home4u.controller.ChatController;
import com.piko.home4u.controller.SavedSearchController;
import com.piko.home4u.controller.TransactionController;
import com.piko.home4u.dto.SavedSearchDto;
import com.piko.home4u.model.ChatMessage;
import com.piko.home4u.model.ChatRoom;
import com.piko.home4u.model.SavedSearch;
import com.piko.home4u.service.ApartmentService;
import com.piko.home4u.service.ChatService;
import com.piko.home4u.service.FavoriteService;
import com.piko.home4u.service.OAuthService;
import com.piko.home4u.service.PropertyService;
import com.piko.home4u.service.RealtorService;
import com.piko.home4u.service.ReviewService;
import com.piko.home4u.service.SavedSearchService;
import com.piko.home4u.service.TransactionService;
import com.piko.home4u.service.UserService;
import com.piko.home4u.service.UserStatsService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
    @Mock private TransactionService transactionService;
    @Mock private FavoriteService favoriteService;
    @Mock private SavedSearchService savedSearchService;
    @Mock private ChatService chatService;
    @Mock private UserStatsService userStatsService;
    @Mock private MessageSource messageSource;

    @InjectMocks private ApartmentController apartmentController;
    @InjectMocks private PropertyController propertyController;
    @InjectMocks private UserController userController;
    @InjectMocks private ReviewController reviewController;
    @InjectMocks private RealtorController realtorController;
    @InjectMocks private OAuthController oAuthController;
    @InjectMocks private TransactionController transactionController;
    @InjectMocks private FavoriteController favoriteController;
    @InjectMocks private SavedSearchController savedSearchController;
    @InjectMocks private ChatController chatController;

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders
                .standaloneSetup(
                        apartmentController,
                        propertyController,
                        userController,
                        reviewController,
                        oAuthController,
                        realtorController,
                        transactionController,
                        favoriteController,
                        savedSearchController,
                        chatController
                )
                .setCustomArgumentResolvers(
                        new org.springframework.data.web.PageableHandlerMethodArgumentResolver())
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

    // ---- 4차 신규 API (Chat) ----

    @Test
    void chat_openRoom_returnsRoom() throws Exception {
        ChatRoom r = ChatRoom.builder().id(7L).build();
        when(chatService.openRoom(1L, 2L, null)).thenReturn(r);

        mockMvc.perform(post("/chats").param("buyerId", "1").param("sellerId", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(7));
    }

    @Test
    void chat_sendMessage_returnsPersisted() throws Exception {
        ChatMessage m = ChatMessage.builder().id(99L).content("hello").build();
        when(chatService.sendMessage(org.mockito.ArgumentMatchers.eq(1L),
                org.mockito.ArgumentMatchers.eq(2L),
                org.mockito.ArgumentMatchers.eq("hello")))
                .thenReturn(m);

        mockMvc.perform(post("/chats/{id}/messages", 1L)
                        .param("userId", "2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"hello\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(99))
                .andExpect(jsonPath("$.content").value("hello"));
    }

    @Test
    void chat_unreadCount_returnsNumber() throws Exception {
        when(chatService.countUnread(1L, 2L)).thenReturn(4L);

        mockMvc.perform(get("/chats/{id}/unread-count", 1L).param("userId", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(4));
    }

    // ---- 5차 신규 API (RealtorStats) ----

    @Test
    void realtorStats_returnsAggregatedMetrics() throws Exception {
        UserStatsService.RealtorStats stats = UserStatsService.RealtorStats.builder()
                .userId(10L)
                .username("alice")
                .role("ROLE_REALTOR")
                .propertyCount(3)
                .totalReviews(5)
                .averageRating(4.6)
                .totalFavorites(12)
                .totalTransactions(4)
                .completionRate(0.5)
                .medianResponseMinutes(30)
                .build();
        when(userStatsService.computeRealtorStats(10L)).thenReturn(stats);

        mockMvc.perform(get("/users/{userId}/realtor-stats", 10L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(10))
                .andExpect(jsonPath("$.username").value("alice"))
                .andExpect(jsonPath("$.averageRating").value(4.6))
                .andExpect(jsonPath("$.completionRate").value(0.5))
                .andExpect(jsonPath("$.medianResponseMinutes").value(30));
    }

    // ---- 3차 신규 API (SavedSearch) ----

    @Test
    void savedSearch_create_returnsIdAndName() throws Exception {
        SavedSearch s = SavedSearch.builder().id(7L).name("내 검색").build();
        when(savedSearchService.save(org.mockito.ArgumentMatchers.any(SavedSearchDto.class))).thenReturn(s);

        mockMvc.perform(post("/saved-searches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userId\":1,\"name\":\"내 검색\",\"transactionType\":\"SALE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.savedSearchId").value(7))
                .andExpect(jsonPath("$.name").value("내 검색"));
    }

    @Test
    void savedSearch_matching_returnsPropertyList() throws Exception {
        Property p = new Property();
        p.setId(1L);
        p.setTitle("matched");
        when(savedSearchService.runMatch(1L)).thenReturn(List.of(p));

        mockMvc.perform(get("/saved-searches/{id}/matching", 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("matched"));
    }

    // ---- 2차 신규 API 6종 ----

    @Test
    void propertiesPaged_returnsPageMetadata() throws Exception {
        org.springframework.data.domain.Page<Property> page =
                new org.springframework.data.domain.PageImpl<>(
                        List.of(),
                        org.springframework.data.domain.PageRequest.of(0, 20),
                        0L);
        when(propertyService.getPagedProperties(org.mockito.ArgumentMatchers.any()))
                .thenReturn(page);

        mockMvc.perform(get("/properties/page").param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0))
                .andExpect(jsonPath("$.size").value(20));
    }

    @Test
    void updateReview_returnsSuccessMessage() throws Exception {
        Review r = Review.builder().id(7L).rating(5).comment("new").build();
        when(reviewService.updateReview(org.mockito.ArgumentMatchers.eq(7L),
                org.mockito.ArgumentMatchers.eq(2L),
                org.mockito.ArgumentMatchers.eq(5),
                org.mockito.ArgumentMatchers.eq("new")))
                .thenReturn(r);

        mockMvc.perform(put("/reviews/{reviewId}", 7L)
                        .param("userId", "2")
                        .param("rating", "5")
                        .param("comment", "new"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reviewId").value(7))
                .andExpect(jsonPath("$.message").value("리뷰 수정 성공"));
    }

    @Test
    void myFavoriteCount_returnsCount() throws Exception {
        when(favoriteService.countForUser(2L)).thenReturn(3L);

        mockMvc.perform(get("/favorites/me/count").param("userId", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(2))
                .andExpect(jsonPath("$.count").value(3));
    }

    @Test
    void favoriteRanking_returnsPropertyIdCountPairs() throws Exception {
        java.util.LinkedHashMap<String, Object> row = new java.util.LinkedHashMap<>();
        row.put("propertyId", 42L);
        row.put("favoriteCount", 7L);
        when(favoriteService.mostFavorited(6)).thenReturn(List.of(row));

        mockMvc.perform(get("/favorites/ranking").param("limit", "6"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].propertyId").value(42))
                .andExpect(jsonPath("$[0].favoriteCount").value(7));
    }

    @Test
    void apartmentCreate_returnsId() throws Exception {
        Apartment apt = new Apartment();
        apt.setId(9L);
        apt.setName("Sky");
        when(apartmentService.createApartment(org.mockito.ArgumentMatchers.any())).thenReturn(apt);

        mockMvc.perform(post("/apartments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Sky\",\"address\":\"addr\",\"gungu\":\"g\",\"dong\":\"d\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.apartmentId").value(9))
                .andExpect(jsonPath("$.message").value("아파트 등록 성공"));
    }

    @Test
    void realtorCreate_returnsId() throws Exception {
        Realtor r = new Realtor();
        r.setId(11L);
        r.setName("Top");
        when(realtorService.createRealtor(org.mockito.ArgumentMatchers.any())).thenReturn(r);

        mockMvc.perform(post("/realtors")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"apartmentId\":1,\"name\":\"Top\",\"phoneNumber\":\"010\",\"address\":\"a\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.realtorId").value(11))
                .andExpect(jsonPath("$.message").value("중개업자 등록 성공"));
    }

    // ---- 신규 API 5종 ----

    @Test
    void popularProperties_returnsList() throws Exception {
        Property p = new Property();
        p.setId(1L);
        p.setTitle("Hot");
        p.setViews(100);
        when(propertyService.getPopularProperties(6)).thenReturn(List.of(p));

        mockMvc.perform(get("/properties/popular").param("limit", "6"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Hot"))
                .andExpect(jsonPath("$[0].views").value(100));
    }

    @Test
    void updateProperty_returnsSuccessMessage() throws Exception {
        Property updated = new Property();
        updated.setId(5L);
        when(propertyService.updateProperty(org.mockito.ArgumentMatchers.eq(5L),
                org.mockito.ArgumentMatchers.eq(10L),
                org.mockito.ArgumentMatchers.any()))
                .thenReturn(updated);

        String body = """
                {
                  "title":"t","description":"d","price":1,
                  "propertyType":"APARTMENT","transactionType":"SALE","address":"a",
                  "latitude":0,"longitude":0,"dong":"d","gungu":"g",
                  "floor":1,"minArea":0,"maxArea":0
                }
                """;
        mockMvc.perform(put("/properties/{id}", 5L)
                        .param("editorId", "10")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.propertyId").value(5))
                .andExpect(jsonPath("$.message").value("매물 수정 성공"));
    }

    @Test
    void propertiesByOwner_returnsList() throws Exception {
        Property p = new Property();
        p.setId(1L);
        p.setTitle("Mine");
        when(propertyService.getPropertiesByOwner(10L)).thenReturn(List.of(p));

        mockMvc.perform(get("/users/{userId}/properties", 10L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Mine"));
    }

    @Test
    void changePassword_missingAuthHeader_returns401() throws Exception {
        mockMvc.perform(put("/users/password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"x\",\"newPassword\":\"abcd\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("인증이 필요합니다."));
    }

    @Test
    void changePassword_happyPath() throws Exception {
        when(userService.getUsernameFromToken("TOKEN")).thenReturn("alice");

        mockMvc.perform(put("/users/password")
                        .header("Authorization", "Bearer TOKEN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"old\",\"newPassword\":\"newpw\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("비밀번호 변경 성공"));
    }

    @Test
    void transactionsMeSummary_aggregatesByStatus() throws Exception {
        Transaction pending = Transaction.builder().id(1L).status(TransactionStatus.PENDING).build();
        Transaction approved = Transaction.builder().id(2L).status(TransactionStatus.APPROVED).build();
        when(transactionService.getTransactionsByBuyer(1L)).thenReturn(List.of(pending));
        when(transactionService.getTransactionsBySeller(1L)).thenReturn(List.of(pending, approved));

        mockMvc.perform(get("/transactions/me/summary").param("userId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.buyer.PENDING").value(1))
                .andExpect(jsonPath("$.buyer.TOTAL").value(1))
                .andExpect(jsonPath("$.seller.PENDING").value(1))
                .andExpect(jsonPath("$.seller.APPROVED").value(1))
                .andExpect(jsonPath("$.seller.TOTAL").value(2));
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
