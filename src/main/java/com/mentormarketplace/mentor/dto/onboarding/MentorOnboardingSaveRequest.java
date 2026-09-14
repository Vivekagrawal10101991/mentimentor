package com.mentormarketplace.mentor.dto.onboarding;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

/** Progressive mentor onboarding payload — fields are optional per step. */
public record MentorOnboardingSaveRequest(
        @Min(1) @Max(7) Integer step,
        @Size(max = 128) String firstName,
        @Size(max = 128) String lastName,
        @Size(max = 32) String gender,
        @Size(max = 128) String city,
        /** ONLINE | OFFLINE | BOTH */
        @Size(max = 16) String teachingMode,
        List<@NotBlank String> expertiseCategories,
        List<@NotBlank String> expertiseSubcategories,
        List<@NotBlank String> languages,
        @Size(max = 128) String highestQualification,
        @Size(max = 256) String college,
        @Size(max = 128) String degree,
        @Size(max = 128) String specialization,
        Integer yearOfCompletion,
        @Size(max = 32) String marksOrCgpa,
        Integer professionalExperienceYears,
        Integer teachingExperienceYears,
        @Size(max = 256) String ageGroupsTaught,
        @Size(max = 4000) String experienceDetails,
        @DecimalMin("0.0") @DecimalMax("100.0") BigDecimal knowledgeScore,
        @DecimalMin("0.0") @DecimalMax("5.0") BigDecimal knowledgeRating,
        @DecimalMin("0.0") @DecimalMax("100.0") BigDecimal pedagogyScore,
        @DecimalMin("0.0") @DecimalMax("5.0") BigDecimal pedagogyRating,
        @Size(min = 4, max = 20) String panNumber,
        @Size(min = 4, max = 20) String aadhaarNumber,
        Boolean completeOnboarding
) {
}
