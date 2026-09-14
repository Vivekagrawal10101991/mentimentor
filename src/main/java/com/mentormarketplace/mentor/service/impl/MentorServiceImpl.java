package com.mentormarketplace.mentor.service.impl;

import com.mentormarketplace.common.exception.BadRequestException;
import com.mentormarketplace.common.exception.ResourceNotFoundException;
import com.mentormarketplace.mentor.availability.dto.MentorAvailabilityRequest;
import com.mentormarketplace.mentor.availability.dto.MentorAvailabilityResponse;
import com.mentormarketplace.mentor.availability.model.MentorAvailabilitySnapshot;
import com.mentormarketplace.mentor.availability.repository.MentorAvailabilityRedisRepository;
import com.mentormarketplace.mentor.availability.repository.MentorAvailabilitySnapshotRepository;
import com.mentormarketplace.mentor.dto.CreateMentorProfileRequest;
import com.mentormarketplace.mentor.dto.ExpertiseRequest;
import com.mentormarketplace.mentor.dto.MentorProfileResponse;
import com.mentormarketplace.mentor.dto.contract.MentorDetailData;
import com.mentormarketplace.mentor.dto.contract.MentorDetailEnvelope;
import com.mentormarketplace.mentor.dto.contract.ExpertiseContract;
import com.mentormarketplace.mentor.dto.contract.MentorProfileData;
import com.mentormarketplace.mentor.dto.contract.MentorProfileEnvelope;
import com.mentormarketplace.mentor.dto.contract.PricingPackageContract;
import com.mentormarketplace.mentor.dto.MentorSearchItem;
import com.mentormarketplace.mentor.dto.MentorSearchResponse;
import com.mentormarketplace.mentor.model.Mentor;
import com.mentormarketplace.mentor.model.MentorExpertise;
import com.mentormarketplace.mentor.repository.MentorRepository;
import com.mentormarketplace.mentor.service.MentorService;
import com.mentormarketplace.user.dto.contract.LocationData;
import com.mentormarketplace.user.model.User;
import com.mentormarketplace.user.repository.UserRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.Comparator;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.List;
import java.util.Set;
import java.util.Locale;
import java.util.UUID;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MentorServiceImpl implements MentorService {

    private final MentorRepository mentorRepository;
    private final UserRepository userRepository;
    private final MentorAvailabilityRedisRepository mentorAvailabilityRedisRepository;
    private final MentorAvailabilitySnapshotRepository mentorAvailabilitySnapshotRepository;

    public MentorServiceImpl(
            MentorRepository mentorRepository,
            UserRepository userRepository,
            MentorAvailabilityRedisRepository mentorAvailabilityRedisRepository,
            MentorAvailabilitySnapshotRepository mentorAvailabilitySnapshotRepository
    ) {
        this.mentorRepository = mentorRepository;
        this.userRepository = userRepository;
        this.mentorAvailabilityRedisRepository = mentorAvailabilityRedisRepository;
        this.mentorAvailabilitySnapshotRepository = mentorAvailabilitySnapshotRepository;
    }

    @Override
    @Transactional
    public MentorProfileResponse createOrUpdateProfile(CreateMentorProfileRequest request) {
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + request.userId()));

        Mentor mentor = mentorRepository.findByUserId(request.userId()).orElseGet(Mentor::new);
        mentor.setUser(user);
        mentor.setHourlyRate(request.hourlyRate());

        List<MentorExpertise> expertise = new ArrayList<>(request.expertise().size());
        for (ExpertiseRequest item : request.expertise()) {
            expertise.add(new MentorExpertise(item.category(), item.subcategory()));
        }
        mentor.setExpertise(expertise);
        mentor.setLanguages(new ArrayList<>(request.languages()));

        if (mentor.getRating() == null) {
            mentor.setRating(BigDecimal.ZERO);
        }
        if (mentor.getBio() == null || mentor.getBio().length() < 20) {
            mentor.setBio("This mentor profile is being completed. Please add more details soon.");
        }
        if (mentor.getModalities() == null || mentor.getModalities().isEmpty()) {
            mentor.setModalities(new ArrayList<>(List.of("video")));
        }

        if (request.experienceDetails() != null && !request.experienceDetails().isBlank()) {
            mentor.setExperienceDetails(request.experienceDetails());
        }
        if (request.linkedinProfile() != null && !request.linkedinProfile().isBlank()) {
            mentor.setLinkedinProfile(request.linkedinProfile());
        }
        if (request.serviceArea() != null) {
            User u = mentor.getUser();
            u.setLocationCity(request.serviceArea().city());
            u.setLocationState(request.serviceArea().state());
            u.setLocationCountry(request.serviceArea().country());
            u.setLocationLat(request.serviceArea().lat());
            u.setLocationLng(request.serviceArea().lng());
            if (request.serviceArea().pinCode() != null) {
                String np = normalizePinCode(request.serviceArea().pinCode());
                u.setLocationPinCode(np.isEmpty() ? null : np);
            }
            userRepository.save(u);
        }

        Mentor saved = mentorRepository.save(mentor);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public MentorDetailEnvelope getMentorById(UUID id) {
        Mentor mentor = mentorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mentor not found: " + id));
        return toMentorDetailEnvelope(mentor);
    }

    @Override
    public MentorAvailabilityResponse updateAvailability(MentorAvailabilityRequest request) {
        mentorRepository.findById(request.mentorId())
                .orElseThrow(() -> new ResourceNotFoundException("Mentor not found: " + request.mentorId()));

        validateLocationInput(request.lat(), request.lng());

        Instant now = Instant.now();
        mentorAvailabilityRedisRepository.upsertLiveStatus(
                request.mentorId(),
                request.available(),
                request.lat(),
                request.lng(),
                now
        );

        return new MentorAvailabilityResponse(
                request.mentorId(),
                request.available(),
                request.lat(),
                request.lng(),
                now
        );
    }

    @Override
    public List<MentorAvailabilityResponse> getAvailableMentors() {
        return mentorAvailabilityRedisRepository.findAllAvailable().stream()
                .map(item -> new MentorAvailabilityResponse(
                        item.mentorId(),
                        item.available(),
                        item.lat(),
                        item.lng(),
                        item.updatedAt()
                ))
                .toList();
    }

    @Override
    @Transactional
    @Scheduled(fixedDelayString = "${app.availability.sync-interval-ms:60000}")
    public void syncAvailabilityToDb() {
        List<MentorAvailabilityRedisRepository.LiveAvailability> liveAvailabilities = mentorAvailabilityRedisRepository.findAllAvailable();
        Set<UUID> liveMentorIds = new HashSet<>();

        for (MentorAvailabilityRedisRepository.LiveAvailability live : liveAvailabilities) {
            liveMentorIds.add(live.mentorId());
            MentorAvailabilitySnapshot snapshot = mentorAvailabilitySnapshotRepository
                    .findByMentorId(live.mentorId())
                    .orElseGet(MentorAvailabilitySnapshot::new);

            snapshot.setMentorId(live.mentorId());
            snapshot.setAvailable(true);
            snapshot.setLat(live.lat());
            snapshot.setLng(live.lng());
            snapshot.setUpdatedAt(live.updatedAt() == null ? Instant.now() : live.updatedAt());
            mentorAvailabilitySnapshotRepository.save(snapshot);
        }

        List<MentorAvailabilitySnapshot> previouslyAvailable = mentorAvailabilitySnapshotRepository.findAllByAvailableTrue();
        Instant now = Instant.now();
        for (MentorAvailabilitySnapshot snapshot : previouslyAvailable) {
            if (!liveMentorIds.contains(snapshot.getMentorId())) {
                snapshot.setAvailable(false);
                snapshot.setLat(null);
                snapshot.setLng(null);
                snapshot.setUpdatedAt(now);
                mentorAvailabilitySnapshotRepository.save(snapshot);
            }
        }
    }

    private MentorProfileResponse toResponse(Mentor mentor) {
        List<ExpertiseRequest> expertise = mentor.getExpertise().stream()
                .map(item -> new ExpertiseRequest(item.getCategory(), item.getSubcategory()))
                .toList();
        List<String> languages = List.copyOf(mentor.getLanguages());

        return new MentorProfileResponse(
                mentor.getId(),
                mentor.getUser().getId(),
                expertise,
                mentor.getHourlyRate(),
                languages,
                mentor.getExperienceDetails(),
                mentor.getLinkedinProfile(),
                mentor.getTestStatus().name(),
                mentor.getRating(),
                mentor.getCreatedAt(),
                mentor.getUpdatedAt()
        );
    }

    private void validateLocationInput(Double lat, Double lng) {
        boolean hasLat = lat != null;
        boolean hasLng = lng != null;
        if (hasLat ^ hasLng) {
            throw new BadRequestException("Both lat and lng must be provided together");
        }
        if (lat != null && (lat < -90 || lat > 90)) {
            throw new BadRequestException("lat must be between -90 and 90");
        }
        if (lng != null && (lng < -180 || lng > 180)) {
            throw new BadRequestException("lng must be between -180 and 180");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public MentorSearchResponse searchMentors(
            String category,
            String subcategory,
            Double radiusKm,
            String pinCode,
            String matchMode,
            int page,
            int pageSize
    ) {
        if (category == null || category.isBlank()) {
            throw new BadRequestException("category is required");
        }
        if (subcategory == null || subcategory.isBlank()) {
            throw new BadRequestException("subcategory is required");
        }
        if (page < 1) {
            throw new BadRequestException("page must be >= 1");
        }
        if (pageSize < 1 || pageSize > 100) {
            throw new BadRequestException("pageSize must be between 1 and 100");
        }
        if (radiusKm != null) {
            throw new BadRequestException("radiusKm is no longer supported for mentor search");
        }

        boolean offline = matchMode != null && "offline".equalsIgnoreCase(matchMode.trim());
        String normalizedSearchPin = normalizePinCode(pinCode);

        boolean filterByPin = false;
        String offlinePin = null;

        if (offline) {
            if (normalizedSearchPin.isEmpty()) {
                throw new BadRequestException("pinCode is required for offline matching");
            }
            filterByPin = true;
            offlinePin = normalizedSearchPin;
        }

        List<MentorAvailabilityRedisRepository.LiveAvailability> liveAvailable = mentorAvailabilityRedisRepository.findAllAvailable();
        Map<UUID, MentorAvailabilityRedisRepository.LiveAvailability> availabilityByMentor = liveAvailable.stream()
                .collect(Collectors.toMap(MentorAvailabilityRedisRepository.LiveAvailability::mentorId, item -> item));

        List<Mentor> candidates = mentorRepository.findByExpertiseCategoryAndSubcategory(category, subcategory);

        List<MentorSearchItem> scored = new ArrayList<>(candidates.size());

        for (Mentor mentor : candidates) {
            MentorAvailabilityRedisRepository.LiveAvailability live = availabilityByMentor.get(mentor.getId());

            if (filterByPin) {
                User u = mentor.getUser();
                String mentorPin = normalizePinCode(u.getLocationPinCode());
                if (!offlinePin.equals(mentorPin)) {
                    continue;
                }
            }

            scored.add(toSearchItem(mentor, live, null));
        }

        scored.sort(searchComparator());

        long total = scored.size();
        int fromIndex = (page - 1) * pageSize;
        if (fromIndex >= scored.size()) {
            return new MentorSearchResponse(List.of(), total, page, pageSize);
        }
        int toIndex = Math.min(fromIndex + pageSize, scored.size());

        return new MentorSearchResponse(scored.subList(fromIndex, toIndex), total, page, pageSize);
    }

    private MentorSearchItem toSearchItem(Mentor mentor, MentorAvailabilityRedisRepository.LiveAvailability live, Double distanceMeters) {
        List<ExpertiseRequest> expertise = mentor.getExpertise().stream()
                .map(item -> new ExpertiseRequest(item.getCategory(), item.getSubcategory()))
                .toList();

        boolean available = live != null && live.available();
        User u = mentor.getUser();
        List<String> languages = List.copyOf(mentor.getLanguages());
        return new MentorSearchItem(
                mentor.getId(),
                mentor.getRating(),
                mentor.getHourlyRate(),
                expertise,
                languages,
                available,
                distanceMeters,
                approximateLocationLabel(u)
        );
    }

    private static String approximateLocationLabel(User u) {
        if (u == null) {
            return "Location not shared";
        }
        String c = u.getLocationCity();
        String s = u.getLocationState();
        if (c != null && !c.isBlank() && s != null && !s.isBlank()) {
            return c + ", " + s;
        }
        if (c != null && !c.isBlank()) {
            return c;
        }
        return "Approximate area only — exact address after confirmation";
    }

    private Comparator<MentorSearchItem> searchComparator() {
        return (a, b) -> {
            BigDecimal ratingA = a.rating() == null ? BigDecimal.ZERO : a.rating();
            BigDecimal ratingB = b.rating() == null ? BigDecimal.ZERO : b.rating();

            int ratingCmp = ratingB.compareTo(ratingA); // desc
            if (ratingCmp != 0) {
                return ratingCmp;
            }

            BigDecimal priceA = a.hourlyRate() == null ? BigDecimal.ZERO : a.hourlyRate();
            BigDecimal priceB = b.hourlyRate() == null ? BigDecimal.ZERO : b.hourlyRate();
            return priceA.compareTo(priceB); // asc
        };
    }

    @Override
    public MentorProfileEnvelope getMyMentorProfileContract(UUID userId) {
        Mentor mentor = mentorRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Mentor profile not found for user: " + userId));
        return new MentorProfileEnvelope(toMentorProfileData(mentor));
    }

    private MentorDetailEnvelope toMentorDetailEnvelope(Mentor mentor) {
        MentorProfileData profile = toMentorProfileData(mentor);
        User user = mentor.getUser();

        String fullName = "Mentor";
        if (user != null) {
            String first = user.getFirstName() == null ? "" : user.getFirstName().trim();
            String last = user.getLastName() == null ? "" : user.getLastName().trim();
            String joined = (first + " " + last).trim();
            if (!joined.isEmpty()) {
                fullName = joined;
            }
        }

        MentorDetailData detail = new MentorDetailData(
                profile.mentorId(),
                fullName,
                mentor.getHeadline() == null ? "" : mentor.getHeadline(),
                profile.rating(),
                profile.totalSessions(),
                profile.expertise(),
                profile.pricingPackages(),
                profile.isAvailableNow(),
                null,
                profile.location(),
                profile.bio(),
                profile.modalities(),
                profile.availability(),
                mentor.getCollege(),
                mentor.getHighestQualification(),
                mentor.getTeachingExperienceYears(),
                mentor.getVerificationStatus(),
                mentor.getRecommendedHourlyRate() != null
                        ? mentor.getRecommendedHourlyRate()
                        : mentor.getHourlyRate(),
                mentor.getKnowledgeRating(),
                mentor.getPedagogyRating(),
                buildWhyThisMentor(mentor),
                mentor.getTeachingMode()
        );
        return new MentorDetailEnvelope(detail);
    }

    private static String buildWhyThisMentor(Mentor mentor) {
        List<String> parts = new ArrayList<>();
        if (mentor.getKnowledgeRating() != null) {
            parts.add("Domain knowledge assessed at " + mentor.getKnowledgeRating() + "/5");
        }
        if (mentor.getPedagogyRating() != null) {
            parts.add("Pedagogy assessed at " + mentor.getPedagogyRating() + "/5");
        }
        if (mentor.getHighestQualification() != null && !mentor.getHighestQualification().isBlank()) {
            parts.add("Qualified: " + mentor.getHighestQualification());
        }
        if (mentor.getTeachingExperienceYears() != null && mentor.getTeachingExperienceYears() > 0) {
            parts.add(mentor.getTeachingExperienceYears() + "+ years teaching experience");
        }
        if ("VERIFIED".equalsIgnoreCase(mentor.getVerificationStatus())
                || "UNDER_REVIEW".equalsIgnoreCase(mentor.getVerificationStatus())) {
            parts.add("Identity verification in progress or completed");
        }
        if (parts.isEmpty()) {
            return "This mentor is building their MentiMentor profile through capability assessment and verification.";
        }
        return String.join(". ", parts) + ".";
    }

    private MentorProfileData toMentorProfileData(Mentor mentor) {
        User user = mentor.getUser();

        List<ExpertiseContract> expertise = mentor.getExpertise().stream()
                .map(e -> {
                    UUID catId = uuidFromStrings(e.getCategory(), "cat");
                    UUID subId = uuidFromStrings(e.getSubcategory(), "sub");
                    String lang = mentor.getLanguages().isEmpty() ? "en" : mentor.getLanguages().getFirst();
                    return new ExpertiseContract(
                            catId,
                            subId,
                            lang,
                            e.getCategory(),
                            e.getSubcategory()
                    );
                })
                .toList();

        int pricePaise = mentor.getHourlyRate() == null
                ? 0
                : mentor.getHourlyRate().multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).intValue();
        UUID packageId = uuidFromStrings(mentor.getId().toString(), "pkg60");
        List<PricingPackageContract> packages = List.of(
                new PricingPackageContract(packageId, 60, pricePaise, "INR", true)
        );

        String city = user.getLocationCity();
        String country = user.getLocationCountry();
        if (city == null || city.isBlank() || country == null || country.isBlank()) {
            city = "Unknown";
            country = "XX";
        }
        LocationData location = new LocationData(
                city,
                user.getLocationState(),
                country,
                user.getLocationLat(),
                user.getLocationLng(),
                user.getLocationFormattedAddress(),
                user.getLocationPinCode()
        );

        boolean available = mentorAvailabilityRedisRepository.findAllAvailable().stream()
                .anyMatch(a -> a.mentorId().equals(mentor.getId()));

        List<String> modalities = mentor.getModalities() == null || mentor.getModalities().isEmpty()
                ? List.of("video")
                : List.copyOf(mentor.getModalities());

        String bio = mentor.getBio() != null && mentor.getBio().length() >= 20
                ? mentor.getBio()
                : "This mentor profile is being completed. Please add more details soon.";

        return new MentorProfileData(
                mentor.getId(),
                bio,
                expertise,
                modalities,
                packages,
                Collections.emptyList(),
                location,
                mentor.getRating(),
                mentor.getTotalSessions(),
                available
        );
    }

    private static UUID uuidFromStrings(String a, String salt) {
        return UUID.nameUUIDFromBytes((a + "\0" + salt).getBytes(StandardCharsets.UTF_8));
    }

    private static String normalizePinCode(String raw) {
        if (raw == null) {
            return "";
        }
        return raw.replaceAll("[\\s-]+", "").toUpperCase(Locale.ROOT);
    }

}
