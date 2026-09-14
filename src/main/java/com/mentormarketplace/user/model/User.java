package com.mentormarketplace.user.model;

import com.mentormarketplace.common.model.KycStatus;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * E.164 prefix (e.g. +91). Maps to {@code phone_country_code} in PostgreSQL.
     * For Google-only accounts we store a reserved prefix so NOT NULL constraints are satisfied.
     */
    @Column(name = "phone_country_code", length = 32)
    private String countryCode;

    /** National digits only; maps to {@code phone_number}. */
    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Column(unique = true, length = 320)
    private String email;

    @Column(name = "google_sub", unique = true, length = 128)
    private String googleSub;

    /**
     * ISO 3166-1 alpha-2 (e.g. IN, US). Maps to {@code country_code} in PostgreSQL — distinct from
     * {@link #countryCode}, which is the E.164 phone prefix ({@code phone_country_code}).
     */
    @Column(name = "country_code", length = 2)
    private String isoCountryCode;

    /**
     * Canonical role on {@code users.role} (PostgreSQL {@code user_role} enum). Required by legacy schema;
     * kept aligned with {@link #roles} for JWT and APIs.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private AccountRole accountRole = AccountRole.mentee;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles")
    @Column(name = "role", nullable = false)
    private List<String> roles = new ArrayList<>();

    @Column(length = 64)
    private String firstName;

    @Column(length = 64)
    private String lastName;

    @Column(length = 512)
    private String avatarUrl;

    @Column(length = 64)
    private String timezone = "UTC";

    @Column(name = "age")
    private Integer age;

    /** Last 12 digits / reference for adult self-serve KYC (admin-reviewed); not for minors. */
    @Column(name = "self_aadhar_reference", length = 64)
    private String selfAadharReference;

    @Enumerated(EnumType.STRING)
    @Column(name = "self_kyc_status", length = 24)
    private KycStatus selfKycStatus;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_languages")
    @Column(name = "language", nullable = false, length = 32)
    private List<String> languages = new ArrayList<>();

    @Column(length = 64)
    private String locationCity;

    @Column(length = 64)
    private String locationState;

    @Column(length = 2)
    private String locationCountry;

    private Double locationLat;

    private Double locationLng;

    /** Normalized postal / PIN code for offline mentor discovery (e.g. Indian PIN). */
    @Column(name = "location_pin_code", length = 16)
    private String locationPinCode;

    @Column(length = 256)
    private String locationFormattedAddress;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public UUID getId() {
        return id;
    }

    public String getCountryCode() {
        return countryCode;
    }

    public void setCountryCode(String countryCode) {
        this.countryCode = countryCode;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getGoogleSub() {
        return googleSub;
    }

    public void setGoogleSub(String googleSub) {
        this.googleSub = googleSub;
    }

    public String getIsoCountryCode() {
        return isoCountryCode;
    }

    public void setIsoCountryCode(String isoCountryCode) {
        this.isoCountryCode = isoCountryCode;
    }

    public AccountRole getAccountRole() {
        return accountRole;
    }

    public void setAccountRole(AccountRole accountRole) {
        this.accountRole = accountRole;
    }

    public List<String> getRoles() {
        return roles;
    }

    public void setRoles(List<String> roles) {
        this.roles = roles;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public String getSelfAadharReference() {
        return selfAadharReference;
    }

    public void setSelfAadharReference(String selfAadharReference) {
        this.selfAadharReference = selfAadharReference;
    }

    public KycStatus getSelfKycStatus() {
        return selfKycStatus;
    }

    public void setSelfKycStatus(KycStatus selfKycStatus) {
        this.selfKycStatus = selfKycStatus;
    }

    @Transient
    public boolean isMinor() {
        return age != null && age < 18;
    }

    public List<String> getLanguages() {
        return languages;
    }

    public void setLanguages(List<String> languages) {
        this.languages = languages;
    }

    public String getLocationCity() {
        return locationCity;
    }

    public void setLocationCity(String locationCity) {
        this.locationCity = locationCity;
    }

    public String getLocationState() {
        return locationState;
    }

    public void setLocationState(String locationState) {
        this.locationState = locationState;
    }

    public String getLocationCountry() {
        return locationCountry;
    }

    public void setLocationCountry(String locationCountry) {
        this.locationCountry = locationCountry;
    }

    public Double getLocationLat() {
        return locationLat;
    }

    public void setLocationLat(Double locationLat) {
        this.locationLat = locationLat;
    }

    public Double getLocationLng() {
        return locationLng;
    }

    public void setLocationLng(Double locationLng) {
        this.locationLng = locationLng;
    }

    public String getLocationPinCode() {
        return locationPinCode;
    }

    public void setLocationPinCode(String locationPinCode) {
        this.locationPinCode = locationPinCode;
    }

    public String getLocationFormattedAddress() {
        return locationFormattedAddress;
    }

    public void setLocationFormattedAddress(String locationFormattedAddress) {
        this.locationFormattedAddress = locationFormattedAddress;
    }
}

