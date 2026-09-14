package com.mentormarketplace.auth.repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Repository;
import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Repository
public class OtpRedisRepository {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public OtpRedisRepository(StringRedisTemplate redisTemplate, ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    public Optional<OtpMeta> findByOtpRequestId(UUID otpRequestId) {
        String json = redisTemplate.opsForValue().get(key(otpRequestId));
        if (json == null) {
            return Optional.empty();
        }
        try {
            return Optional.of(objectMapper.readValue(json, OtpMeta.class));
        } catch (JsonProcessingException e) {
            // Corrupt value should be treated like missing OTP.
            return Optional.empty();
        }
    }

    public void save(UUID otpRequestId, OtpMeta meta, Duration ttl) {
        String json;
        try {
            json = objectMapper.writeValueAsString(meta);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize OTP meta", e);
        }
        redisTemplate.opsForValue().set(key(otpRequestId), json, ttl);
    }

    public Duration ttlLeft(UUID otpRequestId) {
        Long ms = redisTemplate.getExpire(key(otpRequestId), TimeUnit.MILLISECONDS);
        if (ms == null || ms < 0) {
            return Duration.ZERO;
        }
        return Duration.ofMillis(ms);
    }

    public void delete(UUID otpRequestId) {
        redisTemplate.delete(key(otpRequestId));
    }

    private String key(UUID otpRequestId) {
        return "auth:otp:req:" + otpRequestId;
    }

    public static record OtpMeta(
            String code,
            UUID otpRequestId,
            int attempts,
            Instant expiresAt,
            String countryCode,
            String phoneNumber
    ) {
    }
}

