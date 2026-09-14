package com.mentormarketplace.booking;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class IdempotencyService {

    private static final String PREFIX = "idem:booking:";
    private static final String REFUND_PREFIX = "idem:refund:";
    private static final Duration TTL = Duration.ofHours(24);

    private final StringRedisTemplate stringRedisTemplate;

    public IdempotencyService(StringRedisTemplate stringRedisTemplate) {
        this.stringRedisTemplate = stringRedisTemplate;
    }

    public Optional<UUID> getExistingBookingId(String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return Optional.empty();
        }
        String v = stringRedisTemplate.opsForValue().get(PREFIX + idempotencyKey);
        if (v == null) {
            return Optional.empty();
        }
        return Optional.of(UUID.fromString(v));
    }

    public void remember(String idempotencyKey, UUID bookingId) {
        stringRedisTemplate.opsForValue().set(PREFIX + idempotencyKey, bookingId.toString(), TTL);
    }

    public Optional<UUID> getExistingRefundId(String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return Optional.empty();
        }
        String v = stringRedisTemplate.opsForValue().get(REFUND_PREFIX + idempotencyKey);
        if (v == null) {
            return Optional.empty();
        }
        return Optional.of(UUID.fromString(v));
    }

    public void rememberRefund(String idempotencyKey, UUID refundId) {
        stringRedisTemplate.opsForValue().set(REFUND_PREFIX + idempotencyKey, refundId.toString(), TTL);
    }
}
