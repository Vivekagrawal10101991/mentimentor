package com.mentormarketplace.mentor.service;

import com.mentormarketplace.mentor.dto.CreateMentorProfileRequest;
import com.mentormarketplace.mentor.dto.MentorProfileResponse;
import com.mentormarketplace.mentor.dto.MentorSearchResponse;
import com.mentormarketplace.mentor.dto.contract.MentorDetailEnvelope;
import com.mentormarketplace.mentor.dto.contract.MentorProfileEnvelope;
import com.mentormarketplace.mentor.availability.dto.MentorAvailabilityRequest;
import com.mentormarketplace.mentor.availability.dto.MentorAvailabilityResponse;
import java.util.List;
import java.util.UUID;

public interface MentorService {

    MentorProfileResponse createOrUpdateProfile(CreateMentorProfileRequest request);

    MentorDetailEnvelope getMentorById(UUID id);

    MentorAvailabilityResponse updateAvailability(MentorAvailabilityRequest request);

    List<MentorAvailabilityResponse> getAvailableMentors();

    void syncAvailabilityToDb();

    /**
     * @param matchMode {@code online} — all mentors with matching expertise;
     *     {@code offline} — mentors whose service-area PIN/postal code matches {@code pinCode} (normalized).
     */
    MentorSearchResponse searchMentors(
            String category,
            String subcategory,
            Double radiusKm,
            String pinCode,
            String matchMode,
            int page,
            int pageSize
    );

    MentorProfileEnvelope getMyMentorProfileContract(UUID userId);
}
