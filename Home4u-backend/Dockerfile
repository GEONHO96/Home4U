# =============================================================
# Home4U Backend Dockerfile
# Multi-stage: Gradle build → slim JRE runtime
# =============================================================

# ---- Stage 1. build ----
FROM gradle:8.11-jdk17 AS build
WORKDIR /workspace

# 의존성 레이어 캐싱
COPY build.gradle settings.gradle ./
COPY gradle ./gradle
RUN gradle --no-daemon dependencies || true

# 소스 복사 후 빌드 (테스트는 CI 에서 돌리므로 이미지 빌드에서는 스킵)
COPY src ./src
RUN gradle --no-daemon bootJar -x test

# ---- Stage 2. runtime ----
FROM eclipse-temurin:17-jre-alpine AS runtime
WORKDIR /app

# 비루트 계정
RUN addgroup -S app && adduser -S app -G app
USER app

COPY --from=build /workspace/build/libs/*.jar app.jar

EXPOSE 8080

ENV JAVA_OPTS=""
ENV SPRING_PROFILES_ACTIVE=dev

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
