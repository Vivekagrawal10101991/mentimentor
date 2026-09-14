# Production Spring Boot backend (Java 21 / Maven).
# Secrets must be supplied at runtime via environment variables — never bake them into the image.

FROM eclipse-temurin:21-jdk-alpine AS build

WORKDIR /workspace

COPY mvnw pom.xml ./
COPY .mvn .mvn
COPY src src

RUN chmod +x mvnw \
    && ./mvnw -B -DskipTests package \
    && jar="$(ls target/*.jar | grep -v '\.original$' | head -n 1)" \
    && cp "$jar" /workspace/app.jar

FROM eclipse-temurin:21-jre-alpine AS runtime

WORKDIR /app

RUN apk add --no-cache curl \
    && addgroup -S app \
    && adduser -S -G app app

COPY --from=build /workspace/app.jar /app/app.jar

USER app

EXPOSE 8080

# Tuned for a small VM (~4 GB RAM shared across the stack). Override via JAVA_OPTS.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=60.0 -XX:+UseG1GC"

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=5 \
  CMD curl -fsS http://127.0.0.1:8080/actuator/health >/dev/null || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
