package com.mentormarketplace.booking.model;

import com.mentormarketplace.mentor.model.Mentor;
import com.mentormarketplace.user.model.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "bookings")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "mentee_id", nullable = false)
    private User mentee;

    @ManyToOne(optional = false)
    @JoinColumn(name = "mentor_id", nullable = false)
    private Mentor mentor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private BookingType type;

    @Column(name = "package_id")
    private UUID packageId;

    @Enumerated(EnumType.STRING)
    @Column(name = "session_mode", length = 16)
    private SessionMode sessionMode;

    @Column(length = 500)
    private String notes;

    @Column(name = "scheduled_time")
    private Instant scheduledTime;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "booking_status")
    private BookingStatus status;

    @Column(name = "session_start_otp", length = 8)
    private String sessionStartOtp;

    @Column(name = "session_start_otp_expires_at")
    private Instant sessionStartOtpExpiresAt;

    @Column(name = "session_start_otp_issued_at")
    private Instant sessionStartOtpIssuedAt;

    @Column(name = "start_time")
    private Instant startTime;

    @Column(name = "end_time")
    private Instant endTime;

    @Column(name = "duration_seconds")
    private Long durationSeconds;

    @Column(name = "total_amount", precision = 14, scale = 2)
    private BigDecimal totalAmount;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public UUID getId() {
        return id;
    }

    public User getMentee() {
        return mentee;
    }

    public void setMentee(User mentee) {
        this.mentee = mentee;
    }

    public Mentor getMentor() {
        return mentor;
    }

    public void setMentor(Mentor mentor) {
        this.mentor = mentor;
    }

    public BookingType getType() {
        return type;
    }

    public void setType(BookingType type) {
        this.type = type;
    }

    public Instant getScheduledTime() {
        return scheduledTime;
    }

    public void setScheduledTime(Instant scheduledTime) {
        this.scheduledTime = scheduledTime;
    }

    public BookingStatus getStatus() {
        return status;
    }

    public void setStatus(BookingStatus status) {
        this.status = status;
    }

    public String getSessionStartOtp() {
        return sessionStartOtp;
    }

    public void setSessionStartOtp(String sessionStartOtp) {
        this.sessionStartOtp = sessionStartOtp;
    }

    public Instant getSessionStartOtpExpiresAt() {
        return sessionStartOtpExpiresAt;
    }

    public void setSessionStartOtpExpiresAt(Instant sessionStartOtpExpiresAt) {
        this.sessionStartOtpExpiresAt = sessionStartOtpExpiresAt;
    }

    public Instant getStartTime() {
        return startTime;
    }

    public void setStartTime(Instant startTime) {
        this.startTime = startTime;
    }

    public Instant getEndTime() {
        return endTime;
    }

    public void setEndTime(Instant endTime) {
        this.endTime = endTime;
    }

    public Long getDurationSeconds() {
        return durationSeconds;
    }

    public void setDurationSeconds(Long durationSeconds) {
        this.durationSeconds = durationSeconds;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public UUID getPackageId() {
        return packageId;
    }

    public void setPackageId(UUID packageId) {
        this.packageId = packageId;
    }

    public SessionMode getSessionMode() {
        return sessionMode;
    }

    public void setSessionMode(SessionMode sessionMode) {
        this.sessionMode = sessionMode;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Instant getSessionStartOtpIssuedAt() {
        return sessionStartOtpIssuedAt;
    }

    public void setSessionStartOtpIssuedAt(Instant sessionStartOtpIssuedAt) {
        this.sessionStartOtpIssuedAt = sessionStartOtpIssuedAt;
    }
}
