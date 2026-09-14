package com.mentormarketplace.booking.repository;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class BookingOtpRedisRepository {

    private final StringRedisTemplate redisTemplate;

    public BookingOtpRedisRepository(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void saveOtp(UUID bookingId, String otp, Duration ttl) {
        redisTemplate.opsForValue().set(key(bookingId), otp, ttl);
    }

    public Optional<String> getOtp(UUID bookingId) {
        return Optional.ofNullable(redisTemplate.opsForValue().get(key(bookingId)));
    }

    public void deleteOtp(UUID bookingId) {
        redisTemplate.delete(key(bookingId));
    }

    private String key(UUID bookingId) {
        return "booking:start:otp:" + bookingId;
    }
}
