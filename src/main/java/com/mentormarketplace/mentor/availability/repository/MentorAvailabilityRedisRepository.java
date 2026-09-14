package com.mentormarketplace.mentor.availability.repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class MentorAvailabilityRedisRepository {

    private static final String AVAILABLE_SET_KEY = "mentor:availability:available_set";

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public MentorAvailabilityRedisRepository(StringRedisTemplate redisTemplate, ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    public void upsertLiveStatus(UUID mentorId, boolean available, Double lat, Double lng, Instant updatedAt) {
        if (available) {
            LiveAvailability value = new LiveAvailability(mentorId, true, lat, lng, updatedAt);
            String json = toJson(value);
            redisTemplate.opsForValue().set(detailsKey(mentorId), json);
            redisTemplate.opsForSet().add(AVAILABLE_SET_KEY, mentorId.toString());
            return;
        }

        redisTemplate.delete(detailsKey(mentorId));
        redisTemplate.opsForSet().remove(AVAILABLE_SET_KEY, mentorId.toString());
    }

    public Optional<LiveAvailability> findByMentorId(UUID mentorId) {
        String json = redisTemplate.opsForValue().get(detailsKey(mentorId));
        if (json == null) {
            return Optional.empty();
        }
        try {
            return Optional.of(objectMapper.readValue(json, LiveAvailability.class));
        } catch (JsonProcessingException e) {
            redisTemplate.delete(detailsKey(mentorId));
            redisTemplate.opsForSet().remove(AVAILABLE_SET_KEY, mentorId.toString());
            return Optional.empty();
        }
    }

    public List<LiveAvailability> findAllAvailable() {
        Set<String> memberIds = redisTemplate.opsForSet().members(AVAILABLE_SET_KEY);
        if (memberIds == null || memberIds.isEmpty()) {
            return List.of();
        }

        List<LiveAvailability> result = new ArrayList<>();
        for (String memberId : memberIds) {
            UUID mentorId;
            try {
                mentorId = UUID.fromString(memberId);
            } catch (IllegalArgumentException ex) {
                redisTemplate.opsForSet().remove(AVAILABLE_SET_KEY, memberId);
                continue;
            }

            Optional<LiveAvailability> availability = findByMentorId(mentorId);
            availability.ifPresent(result::add);
        }
        return result;
    }

    public Set<String> getAvailableMentorIds() {
        Set<String> memberIds = redisTemplate.opsForSet().members(AVAILABLE_SET_KEY);
        return memberIds == null ? Set.of() : memberIds;
    }

    private String detailsKey(UUID mentorId) {
        return "mentor:availability:details:" + mentorId;
    }

    private String toJson(LiveAvailability value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize live availability", e);
        }
    }

    public record LiveAvailability(
            UUID mentorId,
            boolean available,
            Double lat,
            Double lng,
            Instant updatedAt
    ) {
    }
}
