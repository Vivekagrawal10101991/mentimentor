package com.mentormarketplace.mentor.service.impl;

import com.mentormarketplace.common.exception.BadRequestException;
import com.mentormarketplace.mentor.dto.onboarding.MentorOnboardingSaveRequest;
import com.mentormarketplace.mentor.dto.onboarding.MentorOnboardingStatusResponse;
import com.mentormarketplace.mentor.model.Mentor;
import com.mentormarketplace.mentor.model.MentorExpertise;
import com.mentormarketplace.mentor.model.MentorTestStatus;
import com.mentormarketplace.mentor.repository.MentorRepository;
import com.mentormarketplace.mentor.service.MentorOnboardingService;
import com.mentormarketplace.user.model.User;
import com.mentormarketplace.user.repository.UserRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MentorOnboardingServiceImpl implements MentorOnboardingService {

    private final MentorRepository mentorRepository;
    private final UserRepository userRepository;

    public MentorOnboardingServiceImpl(MentorRepository mentorRepository, UserRepository userRepository) {
        this.mentorRepository = mentorRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public MentorOnboardingStatusResponse getStatus(UUID userId) {
        Mentor mentor = mentorRepository.findByUserIdWithExpertise(userId).orElse(null);
        if (mentor == null) {
            return emptyStatus();
        }
        return toStatus(mentor);
    }

    @Override
    @Transactional
    public MentorOnboardingStatusResponse saveProgress(UUID userId, MentorOnboardingSaveRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));

        Mentor mentor = mentorRepository.findByUserIdWithExpertise(userId).orElseGet(() -> {
            Mentor m = new Mentor();
            m.setUser(user);
            m.setHourlyRate(BigDecimal.valueOf(500));
            m.setLanguages(new ArrayList<>(List.of("en")));
            m.setExpertise(new ArrayList<>());
            m.setModalities(new ArrayList<>(List.of("video")));
            m.setBio("MentiMentor profile is being built. Details will appear after onboarding.");
            m.setRating(BigDecimal.ZERO);
            return m;
        });

        if (request.firstName() != null && !request.firstName().isBlank()) {
            user.setFirstName(request.firstName().trim());
        }
        if (request.lastName() != null && !request.lastName().isBlank()) {
            user.setLastName(request.lastName().trim());
        }

        if (request.gender() != null) {
            mentor.setGender(request.gender());
        }
        if (request.city() != null && !request.city().isBlank()) {
            mentor.setCity(request.city().trim());
            user.setLocationCity(request.city().trim());
        }
        if (request.teachingMode() != null && !request.teachingMode().isBlank()) {
            mentor.setTeachingMode(request.teachingMode().trim().toUpperCase());
            mentor.setModalities(modalitiesFromTeachingMode(mentor.getTeachingMode()));
        }

        if (request.expertiseCategories() != null && !request.expertiseCategories().isEmpty()) {
            List<String> subs = request.expertiseSubcategories() == null
                    ? List.of()
                    : request.expertiseSubcategories();
            List<MentorExpertise> expertise = new ArrayList<>();
            for (int i = 0; i < request.expertiseCategories().size(); i++) {
                String cat = request.expertiseCategories().get(i);
                String sub = i < subs.size() ? subs.get(i) : "General";
                expertise.add(new MentorExpertise(cat, sub));
            }
            if (expertise.isEmpty()) {
                throw new BadRequestException("At least one expertise is required");
            }
            mentor.setExpertise(expertise);
        }

        if (request.languages() != null && !request.languages().isEmpty()) {
            mentor.setLanguages(new ArrayList<>(request.languages()));
        }

        if (request.highestQualification() != null) {
            mentor.setHighestQualification(request.highestQualification());
        }
        if (request.college() != null) {
            mentor.setCollege(request.college());
        }
        if (request.degree() != null) {
            mentor.setDegree(request.degree());
        }
        if (request.specialization() != null) {
            mentor.setSpecialization(request.specialization());
        }
        if (request.yearOfCompletion() != null) {
            mentor.setYearOfCompletion(request.yearOfCompletion());
        }
        if (request.marksOrCgpa() != null) {
            mentor.setMarksOrCgpa(request.marksOrCgpa());
        }
        if (request.professionalExperienceYears() != null) {
            mentor.setProfessionalExperienceYears(request.professionalExperienceYears());
        }
        if (request.teachingExperienceYears() != null) {
            mentor.setTeachingExperienceYears(request.teachingExperienceYears());
        }
        if (request.ageGroupsTaught() != null) {
            mentor.setAgeGroupsTaught(request.ageGroupsTaught());
        }
        if (request.experienceDetails() != null && !request.experienceDetails().isBlank()) {
            mentor.setExperienceDetails(request.experienceDetails());
        }

        if (request.knowledgeScore() != null) {
            mentor.setKnowledgeScore(request.knowledgeScore());
            mentor.setTestStatus(MentorTestStatus.COMPLETED);
        }
        if (request.knowledgeRating() != null) {
            mentor.setKnowledgeRating(scale2(request.knowledgeRating()));
        }
        if (request.pedagogyScore() != null) {
            mentor.setPedagogyScore(request.pedagogyScore());
        }
        if (request.pedagogyRating() != null) {
            mentor.setPedagogyRating(scale2(request.pedagogyRating()));
        }

        if (request.panNumber() != null && !request.panNumber().isBlank()) {
            String pan = request.panNumber().replaceAll("\\s+", "").toUpperCase();
            if (pan.length() < 4) {
                throw new BadRequestException("PAN number looks incomplete");
            }
            mentor.setPanLast4(pan.substring(pan.length() - 4));
        }
        if (request.aadhaarNumber() != null && !request.aadhaarNumber().isBlank()) {
            String aadhaar = request.aadhaarNumber().replaceAll("\\s+", "");
            if (aadhaar.length() < 4) {
                throw new BadRequestException("Aadhaar number looks incomplete");
            }
            mentor.setAadhaarLast4(aadhaar.substring(aadhaar.length() - 4));
        }
        if (mentor.getPanLast4() != null && mentor.getAadhaarLast4() != null) {
            mentor.setVerificationStatus("UNDER_REVIEW");
        }

        if (request.step() != null) {
            mentor.setOnboardingStep(Math.max(mentor.getOnboardingStep(), request.step()));
            mentor.setOnboardingStatus("IN_PROGRESS");
        }

        boolean complete = Boolean.TRUE.equals(request.completeOnboarding());
        if (complete) {
            finalizeOnboarding(mentor);
        } else {
            mentor.setProfileCompletenessPercent(computeCompleteness(mentor));
        }

        userRepository.save(user);
        Mentor saved = mentorRepository.save(mentor);
        return toStatus(saved);
    }

    private void finalizeOnboarding(Mentor mentor) {
        if (mentor.getExpertise() == null || mentor.getExpertise().isEmpty()) {
            throw new BadRequestException("Complete expertise before finishing onboarding");
        }
        if (mentor.getKnowledgeRating() == null || mentor.getPedagogyRating() == null) {
            throw new BadRequestException("Complete knowledge and pedagogy assessments before finishing");
        }
        if (mentor.getPanLast4() == null || mentor.getAadhaarLast4() == null) {
            throw new BadRequestException("Complete identity verification before finishing");
        }

        BigDecimal recommended = computeRecommendedRate(mentor);
        mentor.setRecommendedHourlyRate(recommended);
        mentor.setHourlyRate(recommended);
        mentor.setRating(computeMentimentorRating(mentor));
        mentor.setVerificationStatus("UNDER_REVIEW");
        mentor.setOnboardingStep(7);
        mentor.setOnboardingStatus("COMPLETED");
        mentor.setTestStatus(MentorTestStatus.COMPLETED);
        mentor.setProfileCompletenessPercent(100);
        if (mentor.getBio() == null || mentor.getBio().contains("being built")) {
            String domain = mentor.getExpertise().isEmpty()
                    ? "learning"
                    : mentor.getExpertise().getFirst().getCategory();
            mentor.setBio("Verified MentiMentor for " + domain
                    + ". Capability-assessed and matched based on learner needs.");
        }
        if (mentor.getHeadline() == null || mentor.getHeadline().isBlank()) {
            mentor.setHeadline("Capability-verified mentor");
        }
    }

    static BigDecimal computeRecommendedRate(Mentor mentor) {
        double base = 450;
        double knowledge = mentor.getKnowledgeRating() == null ? 0 : mentor.getKnowledgeRating().doubleValue();
        double pedagogy = mentor.getPedagogyRating() == null ? 0 : mentor.getPedagogyRating().doubleValue();
        int teachYears = mentor.getTeachingExperienceYears() == null ? 0 : mentor.getTeachingExperienceYears();
        int proYears = mentor.getProfessionalExperienceYears() == null ? 0 : mentor.getProfessionalExperienceYears();

        double rate = base
                + knowledge * 70
                + pedagogy * 60
                + Math.min(teachYears, 15) * 18
                + Math.min(proYears, 15) * 8
                + qualificationBonus(mentor.getHighestQualification());

        if (mentor.getPanLast4() != null && mentor.getAadhaarLast4() != null) {
            rate += 40;
        }
        return BigDecimal.valueOf(Math.round(rate / 10.0) * 10L).setScale(2, RoundingMode.HALF_UP);
    }

    private static double qualificationBonus(String qualification) {
        if (qualification == null || qualification.isBlank()) {
            return 0;
        }
        String q = qualification.toLowerCase();
        if (q.contains("phd") || q.contains("doctor")) {
            return 120;
        }
        if (q.contains("master") || q.contains("m.tech") || q.contains("m.sc") || q.contains("mba")) {
            return 80;
        }
        if (q.contains("bachelor") || q.contains("b.tech") || q.contains("b.sc") || q.contains("b.e")) {
            return 40;
        }
        return 20;
    }

    static BigDecimal computeMentimentorRating(Mentor mentor) {
        double knowledge = mentor.getKnowledgeRating() == null ? 0 : mentor.getKnowledgeRating().doubleValue();
        double pedagogy = mentor.getPedagogyRating() == null ? 0 : mentor.getPedagogyRating().doubleValue();
        double experience = Math.min(
                5.0,
                ((mentor.getTeachingExperienceYears() == null ? 0 : mentor.getTeachingExperienceYears()) * 0.25)
                        + ((mentor.getProfessionalExperienceYears() == null ? 0 : mentor.getProfessionalExperienceYears()) * 0.1)
        );
        double profile = computeCompleteness(mentor) / 20.0;
        double rating = (knowledge * 0.35) + (pedagogy * 0.35) + (experience * 0.15) + (Math.min(profile, 5) * 0.15);
        return BigDecimal.valueOf(rating).setScale(2, RoundingMode.HALF_UP);
    }

    private static int computeCompleteness(Mentor mentor) {
        int score = 0;
        if (mentor.getCity() != null && !mentor.getCity().isBlank()) score += 10;
        if (mentor.getTeachingMode() != null) score += 10;
        if (mentor.getExpertise() != null && !mentor.getExpertise().isEmpty()) score += 15;
        if (mentor.getHighestQualification() != null) score += 10;
        if (mentor.getCollege() != null) score += 5;
        if (mentor.getTeachingExperienceYears() != null) score += 10;
        if (mentor.getKnowledgeRating() != null) score += 15;
        if (mentor.getPedagogyRating() != null) score += 15;
        if (mentor.getPanLast4() != null) score += 5;
        if (mentor.getAadhaarLast4() != null) score += 5;
        return Math.min(100, score);
    }

    private static List<String> modalitiesFromTeachingMode(String mode) {
        if ("OFFLINE".equalsIgnoreCase(mode)) {
            return new ArrayList<>(List.of("in_person"));
        }
        if ("BOTH".equalsIgnoreCase(mode)) {
            return new ArrayList<>(List.of("video", "in_person"));
        }
        return new ArrayList<>(List.of("video"));
    }

    private static BigDecimal scale2(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private static MentorOnboardingStatusResponse emptyStatus() {
        return new MentorOnboardingStatusResponse(
                null,
                0,
                "NOT_STARTED",
                0,
                "PENDING",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                List.of(),
                List.of(),
                List.of()
        );
    }

    private MentorOnboardingStatusResponse toStatus(Mentor mentor) {
        List<String> cats = mentor.getExpertise() == null
                ? List.of()
                : mentor.getExpertise().stream().map(MentorExpertise::getCategory).toList();
        List<String> subs = mentor.getExpertise() == null
                ? List.of()
                : mentor.getExpertise().stream().map(MentorExpertise::getSubcategory).toList();

        BigDecimal rating = mentor.getRating() == null || mentor.getRating().compareTo(BigDecimal.ZERO) == 0
                ? (mentor.getKnowledgeRating() != null && mentor.getPedagogyRating() != null
                        ? computeMentimentorRating(mentor)
                        : null)
                : mentor.getRating();

        List<String> breakdown = List.of(
                "Qualification",
                "Experience",
                "Knowledge Assessment",
                "Pedagogy Assessment",
                "Verification",
                "Student Feedback (as you teach)"
        );

        return new MentorOnboardingStatusResponse(
                mentor.getId(),
                mentor.getOnboardingStep(),
                mentor.getOnboardingStatus(),
                mentor.getProfileCompletenessPercent(),
                mentor.getVerificationStatus(),
                mentor.getKnowledgeScore(),
                mentor.getKnowledgeRating(),
                mentor.getPedagogyScore(),
                mentor.getPedagogyRating(),
                mentor.getRecommendedHourlyRate() != null
                        ? mentor.getRecommendedHourlyRate()
                        : mentor.getHourlyRate(),
                rating,
                mentor.getCity(),
                mentor.getTeachingMode(),
                mentor.getHighestQualification(),
                mentor.getCollege(),
                mentor.getDegree(),
                mentor.getTeachingExperienceYears(),
                cats,
                subs,
                breakdown
        );
    }
}
