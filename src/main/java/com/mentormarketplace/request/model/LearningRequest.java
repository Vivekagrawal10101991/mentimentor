package com.mentormarketplace.request.model;

import com.mentormarketplace.user.model.User;
import com.mentormarketplace.mentor.model.Mentor;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "learning_requests")
public class LearningRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "mentee_id", nullable = false)
    private User mentee;

    @ManyToOne
    @JoinColumn(name = "assigned_mentor_id")
    private Mentor assignedMentor;

    @Column(nullable = false, length = 128)
    private String category;

    @Column(nullable = false, length = 128)
    private String subcategory;

    @Column(nullable = false, length = 16)
    private String mode;

    @Column(name = "schedule_type", nullable = false, length = 16)
    private String scheduleType;

    @Column(name = "preferred_schedule", length = 512)
    private String preferredSchedule;

    @Column(name = "location_preference", length = 512)
    private String locationPreference;

    /** AT_MENTOR (go to mentor) or INVITE_MENTOR; used when mode is offline. */
    @Column(name = "offline_venue_type", length = 32)
    private String offlineVenueType;

    @Column(nullable = false, length = 24)
    private String status;

    /** Set when mentor accepts; mentor must confirm before this instant. */
    @Column(name = "confirmation_expires_at")
    private Instant confirmationExpiresAt;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public UUID getId() { return id; }
    public User getMentee() { return mentee; }
    public void setMentee(User mentee) { this.mentee = mentee; }
    public Mentor getAssignedMentor() { return assignedMentor; }
    public void setAssignedMentor(Mentor assignedMentor) { this.assignedMentor = assignedMentor; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getSubcategory() { return subcategory; }
    public void setSubcategory(String subcategory) { this.subcategory = subcategory; }
    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }
    public String getScheduleType() { return scheduleType; }
    public void setScheduleType(String scheduleType) { this.scheduleType = scheduleType; }
    public String getPreferredSchedule() { return preferredSchedule; }
    public void setPreferredSchedule(String preferredSchedule) { this.preferredSchedule = preferredSchedule; }
    public String getLocationPreference() { return locationPreference; }
    public void setLocationPreference(String locationPreference) { this.locationPreference = locationPreference; }
    public String getOfflineVenueType() { return offlineVenueType; }
    public void setOfflineVenueType(String offlineVenueType) { this.offlineVenueType = offlineVenueType; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getConfirmationExpiresAt() { return confirmationExpiresAt; }
    public void setConfirmationExpiresAt(Instant confirmationExpiresAt) {
        this.confirmationExpiresAt = confirmationExpiresAt;
    }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
