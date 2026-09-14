package com.mentormarketplace.mentor.model;

import com.mentormarketplace.user.model.User;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.Instant;

@Entity
@Table(name = "mentor_profiles")
public class Mentor {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @ElementCollection
    @CollectionTable(name = "mentor_expertise", joinColumns = @JoinColumn(name = "mentor_id"))
    private List<MentorExpertise> expertise = new ArrayList<>();

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal hourlyRate;

    @ElementCollection
    @CollectionTable(name = "mentor_languages", joinColumns = @JoinColumn(name = "mentor_id"))
    @Column(name = "language", nullable = false)
    private List<String> languages = new ArrayList<>();

    @Column(nullable = false, precision = 3, scale = 2)
    private BigDecimal rating = BigDecimal.ZERO;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal walletBalance = BigDecimal.ZERO;

    @Column(length = 2000)
    private String bio;

    @Column(length = 160)
    private String headline;

    @Column(name = "experience_details", length = 4000)
    private String experienceDetails;

    @Column(name = "linkedin_profile", length = 512)
    private String linkedinProfile;

    @Enumerated(EnumType.STRING)
    @Column(name = "test_status", nullable = false, length = 16)
    private MentorTestStatus testStatus = MentorTestStatus.NONE;

    @ElementCollection
    @CollectionTable(name = "mentor_modalities", joinColumns = @JoinColumn(name = "mentor_id"))
    @Column(name = "modality", nullable = false, length = 16)
    private List<String> modalities = new ArrayList<>();

    @Column(nullable = false)
    private int totalSessions;

    /** Progressive onboarding step index (1–7), 0 = not started. */
    @Column(name = "onboarding_step", nullable = false)
    private int onboardingStep = 0;

    @Column(name = "onboarding_status", nullable = false, length = 24)
    private String onboardingStatus = "NOT_STARTED";

    @Column(name = "knowledge_score", precision = 5, scale = 2)
    private BigDecimal knowledgeScore;

    @Column(name = "knowledge_rating", precision = 3, scale = 2)
    private BigDecimal knowledgeRating;

    @Column(name = "pedagogy_score", precision = 5, scale = 2)
    private BigDecimal pedagogyScore;

    @Column(name = "pedagogy_rating", precision = 3, scale = 2)
    private BigDecimal pedagogyRating;

    /** Platform-assigned rate; mentors do not set this themselves. */
    @Column(name = "recommended_hourly_rate", precision = 12, scale = 2)
    private BigDecimal recommendedHourlyRate;

    @Column(name = "verification_status", nullable = false, length = 24)
    private String verificationStatus = "PENDING";

    @Column(name = "pan_last4", length = 4)
    private String panLast4;

    @Column(name = "aadhaar_last4", length = 4)
    private String aadhaarLast4;

    @Column(name = "highest_qualification", length = 128)
    private String highestQualification;

    @Column(length = 256)
    private String college;

    @Column(length = 128)
    private String degree;

    @Column(length = 128)
    private String specialization;

    @Column(name = "year_of_completion")
    private Integer yearOfCompletion;

    @Column(name = "marks_or_cgpa", length = 32)
    private String marksOrCgpa;

    @Column(name = "professional_experience_years")
    private Integer professionalExperienceYears;

    @Column(name = "teaching_experience_years")
    private Integer teachingExperienceYears;

    @Column(name = "age_groups_taught", length = 256)
    private String ageGroupsTaught;

    @Column(length = 32)
    private String gender;

    @Column(length = 128)
    private String city;

    /** ONLINE | OFFLINE | BOTH */
    @Column(name = "teaching_mode", length = 16)
    private String teachingMode;

    @Column(name = "profile_completeness_percent", nullable = false)
    private int profileCompletenessPercent = 0;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public UUID getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public List<MentorExpertise> getExpertise() {
        return expertise;
    }

    public void setExpertise(List<MentorExpertise> expertise) {
        this.expertise = expertise;
    }

    public BigDecimal getHourlyRate() {
        return hourlyRate;
    }

    public void setHourlyRate(BigDecimal hourlyRate) {
        this.hourlyRate = hourlyRate;
    }

    public List<String> getLanguages() {
        return languages;
    }

    public void setLanguages(List<String> languages) {
        this.languages = languages;
    }

    public BigDecimal getRating() {
        return rating;
    }

    public void setRating(BigDecimal rating) {
        this.rating = rating;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public BigDecimal getWalletBalance() {
        return walletBalance;
    }

    public void setWalletBalance(BigDecimal walletBalance) {
        this.walletBalance = walletBalance;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getHeadline() {
        return headline;
    }

    public void setHeadline(String headline) {
        this.headline = headline;
    }

    public String getExperienceDetails() {
        return experienceDetails;
    }

    public void setExperienceDetails(String experienceDetails) {
        this.experienceDetails = experienceDetails;
    }

    public String getLinkedinProfile() {
        return linkedinProfile;
    }

    public void setLinkedinProfile(String linkedinProfile) {
        this.linkedinProfile = linkedinProfile;
    }

    public MentorTestStatus getTestStatus() {
        return testStatus;
    }

    public void setTestStatus(MentorTestStatus testStatus) {
        this.testStatus = testStatus;
    }

    public List<String> getModalities() {
        return modalities;
    }

    public void setModalities(List<String> modalities) {
        this.modalities = modalities;
    }

    public int getTotalSessions() {
        return totalSessions;
    }

    public void setTotalSessions(int totalSessions) {
        this.totalSessions = totalSessions;
    }

    public int getOnboardingStep() {
        return onboardingStep;
    }

    public void setOnboardingStep(int onboardingStep) {
        this.onboardingStep = onboardingStep;
    }

    public String getOnboardingStatus() {
        return onboardingStatus;
    }

    public void setOnboardingStatus(String onboardingStatus) {
        this.onboardingStatus = onboardingStatus;
    }

    public BigDecimal getKnowledgeScore() {
        return knowledgeScore;
    }

    public void setKnowledgeScore(BigDecimal knowledgeScore) {
        this.knowledgeScore = knowledgeScore;
    }

    public BigDecimal getKnowledgeRating() {
        return knowledgeRating;
    }

    public void setKnowledgeRating(BigDecimal knowledgeRating) {
        this.knowledgeRating = knowledgeRating;
    }

    public BigDecimal getPedagogyScore() {
        return pedagogyScore;
    }

    public void setPedagogyScore(BigDecimal pedagogyScore) {
        this.pedagogyScore = pedagogyScore;
    }

    public BigDecimal getPedagogyRating() {
        return pedagogyRating;
    }

    public void setPedagogyRating(BigDecimal pedagogyRating) {
        this.pedagogyRating = pedagogyRating;
    }

    public BigDecimal getRecommendedHourlyRate() {
        return recommendedHourlyRate;
    }

    public void setRecommendedHourlyRate(BigDecimal recommendedHourlyRate) {
        this.recommendedHourlyRate = recommendedHourlyRate;
    }

    public String getVerificationStatus() {
        return verificationStatus;
    }

    public void setVerificationStatus(String verificationStatus) {
        this.verificationStatus = verificationStatus;
    }

    public String getPanLast4() {
        return panLast4;
    }

    public void setPanLast4(String panLast4) {
        this.panLast4 = panLast4;
    }

    public String getAadhaarLast4() {
        return aadhaarLast4;
    }

    public void setAadhaarLast4(String aadhaarLast4) {
        this.aadhaarLast4 = aadhaarLast4;
    }

    public String getHighestQualification() {
        return highestQualification;
    }

    public void setHighestQualification(String highestQualification) {
        this.highestQualification = highestQualification;
    }

    public String getCollege() {
        return college;
    }

    public void setCollege(String college) {
        this.college = college;
    }

    public String getDegree() {
        return degree;
    }

    public void setDegree(String degree) {
        this.degree = degree;
    }

    public String getSpecialization() {
        return specialization;
    }

    public void setSpecialization(String specialization) {
        this.specialization = specialization;
    }

    public Integer getYearOfCompletion() {
        return yearOfCompletion;
    }

    public void setYearOfCompletion(Integer yearOfCompletion) {
        this.yearOfCompletion = yearOfCompletion;
    }

    public String getMarksOrCgpa() {
        return marksOrCgpa;
    }

    public void setMarksOrCgpa(String marksOrCgpa) {
        this.marksOrCgpa = marksOrCgpa;
    }

    public Integer getProfessionalExperienceYears() {
        return professionalExperienceYears;
    }

    public void setProfessionalExperienceYears(Integer professionalExperienceYears) {
        this.professionalExperienceYears = professionalExperienceYears;
    }

    public Integer getTeachingExperienceYears() {
        return teachingExperienceYears;
    }

    public void setTeachingExperienceYears(Integer teachingExperienceYears) {
        this.teachingExperienceYears = teachingExperienceYears;
    }

    public String getAgeGroupsTaught() {
        return ageGroupsTaught;
    }

    public void setAgeGroupsTaught(String ageGroupsTaught) {
        this.ageGroupsTaught = ageGroupsTaught;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getTeachingMode() {
        return teachingMode;
    }

    public void setTeachingMode(String teachingMode) {
        this.teachingMode = teachingMode;
    }

    public int getProfileCompletenessPercent() {
        return profileCompletenessPercent;
    }

    public void setProfileCompletenessPercent(int profileCompletenessPercent) {
        this.profileCompletenessPercent = profileCompletenessPercent;
    }
}
