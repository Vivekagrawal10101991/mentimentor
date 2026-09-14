package com.mentormarketplace.user.service.impl;

import com.mentormarketplace.common.exception.BadRequestException;
import com.mentormarketplace.common.exception.ResourceNotFoundException;
import com.mentormarketplace.common.model.KycStatus;
import com.mentormarketplace.user.dto.CreateUserProfileRequest;
import com.mentormarketplace.user.dto.UserProfileResponse;
import com.mentormarketplace.user.dto.contract.InterestData;
import com.mentormarketplace.user.dto.contract.InterestsEnvelope;
import com.mentormarketplace.user.dto.contract.LocationData;
import com.mentormarketplace.user.dto.contract.UpdateUserProfileRequest;
import com.mentormarketplace.user.dto.contract.UpsertInterestsRequest;
import com.mentormarketplace.user.dto.contract.UserProfileData;
import com.mentormarketplace.user.dto.contract.UserProfileEnvelope;
import com.mentormarketplace.parent.model.ParentDetails;
import com.mentormarketplace.parent.repository.ParentDetailsRepository;
import com.mentormarketplace.user.model.MenteeInterest;
import com.mentormarketplace.user.model.User;
import com.mentormarketplace.user.model.UserProfile;
import com.mentormarketplace.user.repository.MenteeInterestRepository;
import com.mentormarketplace.user.repository.UserProfileRepository;
import com.mentormarketplace.user.repository.UserRepository;
import com.mentormarketplace.user.service.UserProfileService;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserProfileServiceImpl implements UserProfileService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final MenteeInterestRepository menteeInterestRepository;
    private final ParentDetailsRepository parentDetailsRepository;

    public UserProfileServiceImpl(
            UserRepository userRepository,
            UserProfileRepository userProfileRepository,
            MenteeInterestRepository menteeInterestRepository,
            ParentDetailsRepository parentDetailsRepository
    ) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.menteeInterestRepository = menteeInterestRepository;
        this.parentDetailsRepository = parentDetailsRepository;
    }

    @Override
    public UserProfileResponse createOrUpdateProfile(CreateUserProfileRequest request) {
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + request.userId()));

        UserProfile profile = userProfileRepository.findByUserId(request.userId()).orElseGet(UserProfile::new);
        profile.setUser(user);
        profile.setInterests(request.interests());
        profile.setLanguage(request.language());

        UserProfile saved = userProfileRepository.save(profile);
        return new UserProfileResponse(
                saved.getId(),
                saved.getUser().getId(),
                saved.getInterests(),
                saved.getLanguage(),
                saved.getCreatedAt(),
                saved.getUpdatedAt()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileEnvelope getMyProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        return new UserProfileEnvelope(toContractProfile(user));
    }

    @Override
    @Transactional
    public UserProfileEnvelope updateMyProfile(UUID userId, UpdateUserProfileRequest request) {
        if (request.firstName() == null
                && request.lastName() == null
                && request.age() == null
                && request.aadharReference() == null
                && request.avatarUrl() == null
                && request.timezone() == null
                && request.preferredLearningMode() == null
                && request.preferredSchedule() == null
                && request.languages() == null
                && request.location() == null) {
            throw new BadRequestException("At least one field is required");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        if (request.firstName() != null) {
            user.setFirstName(request.firstName());
        }
        if (request.lastName() != null) {
            user.setLastName(request.lastName());
        }
        if (request.age() != null) {
            if (request.age() < 0 || request.age() > 120) {
                throw new BadRequestException("age must be between 0 and 120");
            }
            user.setAge(request.age());
        }
        if (request.aadharReference() != null) {
            Integer ageAfter = request.age() != null ? request.age() : user.getAge();
            if (ageAfter == null || ageAfter < 18) {
                throw new BadRequestException("Confirm you are 18 or older before submitting your Aadhaar");
            }
            if (user.getSelfKycStatus() == KycStatus.VERIFIED) {
                throw new BadRequestException("Your identity is already verified");
            }
            user.setSelfAadharReference(request.aadharReference());
            user.setSelfKycStatus(KycStatus.SUBMITTED);
        }
        if (request.avatarUrl() != null) {
            user.setAvatarUrl(request.avatarUrl());
        }
        if (request.timezone() != null) {
            user.setTimezone(request.timezone());
        }
        if (request.languages() != null) {
            user.setLanguages(new ArrayList<>(request.languages()));
        }
        if (request.preferredLearningMode() != null || request.preferredSchedule() != null) {
            UserProfile profile = userProfileRepository.findByUserId(userId).orElseGet(UserProfile::new);
            if (profile.getUser() == null) {
                profile.setUser(user);
            }
            if (profile.getLanguage() == null || profile.getLanguage().isBlank()) {
                profile.setLanguage(resolveDefaultProfileLanguage(user));
            }
            if (request.preferredLearningMode() != null) {
                profile.setPreferredLearningMode(request.preferredLearningMode());
            }
            if (request.preferredSchedule() != null) {
                profile.setPreferredSchedule(request.preferredSchedule());
            }
            userProfileRepository.save(profile);
        }
        if (request.location() != null) {
            user.setLocationCity(request.location().city());
            user.setLocationState(request.location().state());
            user.setLocationCountry(request.location().country());
            user.setLocationLat(request.location().lat());
            user.setLocationLng(request.location().lng());
        }
        User saved = userRepository.save(user);
        return new UserProfileEnvelope(toContractProfile(saved));
    }

    private String resolveDefaultProfileLanguage(User user) {
        if (user.getLanguages() != null && !user.getLanguages().isEmpty()) {
            String first = user.getLanguages().getFirst();
            if (first != null && !first.isBlank()) {
                return first;
            }
        }
        return "en";
    }

    @Override
    @Transactional
    public InterestsEnvelope upsertInterests(UUID userId, UpsertInterestsRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        menteeInterestRepository.deleteByUser_Id(userId);
        List<InterestData> saved = new ArrayList<>();
        for (var input : request.interests()) {
            MenteeInterest row = new MenteeInterest();
            row.setUser(user);
            row.setCategoryId(input.categoryId());
            row.setSubcategoryId(input.subcategoryId());
            row.setLanguage(input.language());
            MenteeInterest persisted = menteeInterestRepository.save(row);
            saved.add(new InterestData(
                    persisted.getId(),
                    persisted.getCategoryId(),
                    persisted.getSubcategoryId(),
                    persisted.getLanguage()
            ));
        }
        return new InterestsEnvelope(saved);
    }

    private UserProfileData toContractProfile(User user) {
        String first = blankToNull(user.getFirstName());
        String last = blankToNull(user.getLastName());
        List<String> langs = user.getLanguages() == null || user.getLanguages().isEmpty()
                ? List.of("en")
                : List.copyOf(user.getLanguages());
        List<String> roles = user.getRoles().stream().map(String::toLowerCase).toList();
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
        String phone = user.getPhoneNumber();
        if (phone == null || phone.isBlank()) {
            phone = user.getEmail() != null ? user.getEmail() : "";
        }
        String cc = user.getCountryCode();
        if (cc == null || cc.isBlank()) {
            cc = "";
        }
        ParentDetails parent = parentDetailsRepository
                .findTopByUserIdOrderByCreatedAtDesc(user.getId())
                .orElse(null);
        String selfKyc = user.getSelfKycStatus() == null ? null : user.getSelfKycStatus().name();
        String parentKyc = parent == null ? null : parent.getKycStatus().name();
        UUID parentDetailsId = parent == null ? null : parent.getId();
        return new UserProfileData(
                user.getId(),
                first,
                last,
                user.getAge(),
                user.isMinor(),
                phone,
                cc,
                user.getAvatarUrl(),
                user.getTimezone() == null ? "UTC" : user.getTimezone(),
                langs,
                location,
                roles,
                user.getCreatedAt(),
                user.getUpdatedAt(),
                selfKyc,
                parentKyc,
                parentDetailsId,
                computeVerificationComplete(user, parent)
        );
    }

    private static boolean computeVerificationComplete(User user, ParentDetails parent) {
        if (user.getAge() == null) {
            return false;
        }
        if (user.isMinor()) {
            return parent != null && parent.getKycStatus() == KycStatus.VERIFIED;
        }
        return user.getSelfKycStatus() == KycStatus.VERIFIED;
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value;
    }
}
