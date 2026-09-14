package com.mentormarketplace.parent.repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ParentOtpRedisRepository {
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public ParentOtpRedisRepository(StringRedisTemplate redisTemplate, ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    public Optional<ParentOtpMeta> findByOtpRequestId(UUID otpRequestId) {
        String json = redisTemplate.opsForValue().get(key(otpRequestId));
        if (json == null) return Optional.empty();
        try {
            return Optional.of(objectMapper.readValue(json, ParentOtpMeta.class));
        } catch (JsonProcessingException e) {
            return Optional.empty();
        }
    }

    public void save(UUID otpRequestId, ParentOtpMeta meta, Duration ttl) {
        try {
            redisTemplate.opsForValue().set(key(otpRequestId), objectMapper.writeValueAsString(meta), ttl);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize parent otp meta", e);
        }
    }

    public Duration ttlLeft(UUID otpRequestId) {
        Long ms = redisTemplate.getExpire(key(otpRequestId), TimeUnit.MILLISECONDS);
        if (ms == null || ms < 0) return Duration.ZERO;
        return Duration.ofMillis(ms);
    }

    public void delete(UUID otpRequestId) {
        redisTemplate.delete(key(otpRequestId));
    }

    private String key(UUID otpRequestId) {
        return "parent:otp:req:" + otpRequestId;
    }

    public record ParentOtpMeta(
            UUID parentDetailsId,
            UUID otpRequestId,
            String parentPhone,
            String code,
            int attempts,
            Instant expiresAt
    ) {
    }
}
