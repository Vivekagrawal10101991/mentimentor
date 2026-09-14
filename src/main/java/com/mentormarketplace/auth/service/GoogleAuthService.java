package com.mentormarketplace.auth.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.mentormarketplace.auth.JwtTokenService;
import com.mentormarketplace.auth.dto.UserSummary;
import com.mentormarketplace.auth.dto.VerifyOtpContractResponse;
import com.mentormarketplace.common.exception.BadRequestException;
import com.mentormarketplace.config.GoogleOAuthProperties;
import com.mentormarketplace.config.JwtProperties;
import com.mentormarketplace.user.model.AccountRole;
import com.mentormarketplace.user.model.User;
import com.mentormarketplace.user.repository.UserRepository;
import com.mentormarketplace.user.support.PhonePrefixToIsoCountry;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class GoogleAuthService {

    /**
     * Reserved E.164 prefix for OAuth-only rows (no real phone). Must match CHECK on {@code phone_country_code}
     * and stay unique with {@link #syntheticPhoneNumberFromGoogleSub(String)} under (phone_country_code, phone_number).
     */
    private static final String OAUTH_ONLY_PHONE_COUNTRY_CODE = "+999";

    private final GoogleOAuthProperties googleOAuthProperties;
    private final UserRepository userRepository;
    private final JwtTokenService jwtTokenService;
    private final JwtProperties jwtProperties;

    public GoogleAuthService(
            GoogleOAuthProperties googleOAuthProperties,
            UserRepository userRepository,
            JwtTokenService jwtTokenService,
            JwtProperties jwtProperties
    ) {
        this.googleOAuthProperties = googleOAuthProperties;
        this.userRepository = userRepository;
        this.jwtTokenService = jwtTokenService;
        this.jwtProperties = jwtProperties;
    }

    public VerifyOtpContractResponse signIn(String credential) {
        String clientId = googleOAuthProperties.clientId();
        if (clientId == null || clientId.isBlank()) {
            throw new BadRequestException("Google sign-in is not configured");
        }
        GoogleIdToken idToken;
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance()
            )
                    .setAudience(Collections.singletonList(clientId))
                    .build();
            idToken = verifier.verify(credential);
        } catch (GeneralSecurityException | IOException e) {
            throw new BadRequestException("Google sign-in failed: " + e.getMessage());
        }
        if (idToken == null) {
            throw new BadRequestException("Invalid Google token");
        }
        GoogleIdToken.Payload payload = idToken.getPayload();
        String email = payload.getEmail();
        String sub = payload.getSubject();
        if (email == null || email.isBlank() || sub == null || sub.isBlank()) {
            throw new BadRequestException("Google account email or subject missing");
        }
        if (Boolean.FALSE.equals(payload.getEmailVerified())) {
            throw new BadRequestException("Google email must be verified");
        }

        User user = userRepository
                .findByGoogleSub(sub)
                .or(() -> userRepository.findByEmailIgnoreCase(email))
                .orElseGet(() -> createNewUser(email, sub, payload));

        boolean dirty = false;
        if (user.getGoogleSub() == null || !user.getGoogleSub().equals(sub)) {
            user.setGoogleSub(sub);
            dirty = true;
        }
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            user.setEmail(email);
            dirty = true;
        }
        if (applyGoogleProfileClaims(user, payload)) {
            dirty = true;
        }
        if (user.getIsoCountryCode() == null || user.getIsoCountryCode().isBlank()) {
            user.setIsoCountryCode(PhonePrefixToIsoCountry.isoAlpha2(user.getCountryCode()));
            dirty = true;
        }
        if (dirty) {
            user = userRepository.save(user);
        }

        String accessToken = jwtTokenService.createAccessToken(user.getId(), user.getRoles());
        String refreshToken = jwtTokenService.createRefreshToken(user.getId());
        long expiresIn = Math.max(60, jwtProperties.accessTokenTtl().toSeconds());

        return new VerifyOtpContractResponse(
                accessToken,
                refreshToken,
                "Bearer",
                expiresIn,
                UserSummary.fromUser(user)
        );
    }

    private User createNewUser(String email, String sub, GoogleIdToken.Payload payload) {
        User user = new User();
        user.setEmail(email);
        user.setGoogleSub(sub);
        user.setAccountRole(AccountRole.mentee);
        user.setRoles(List.of("mentee"));
        applyGoogleProfileClaims(user, payload);
        user.setCountryCode(OAUTH_ONLY_PHONE_COUNTRY_CODE);
        user.setPhoneNumber(syntheticPhoneNumberFromGoogleSub(sub));
        user.setIsoCountryCode(PhonePrefixToIsoCountry.isoAlpha2(OAUTH_ONLY_PHONE_COUNTRY_CODE));
        return userRepository.save(user);
    }

    /**
     * Copies display name and picture from the verified ID token into the user row.
     * Called for new users and on every Google sign-in so names stay aligned with Google
     * (given_name / family_name / full {@code name} claim).
     *
     * @return true if any field on {@code user} was changed
     */
    static boolean applyGoogleProfileClaims(User user, GoogleIdToken.Payload payload) {
        boolean changed = false;
        String given = stringClaim(payload, "given_name");
        String family = stringClaim(payload, "family_name");
        String fullName = stringClaim(payload, "name");
        if (given == null && fullName != null && !fullName.isBlank()) {
            String trimmed = fullName.trim();
            int sp = trimmed.indexOf(' ');
            if (sp > 0) {
                given = trimmed.substring(0, sp).trim();
                family = trimmed.substring(sp + 1).trim();
            } else {
                given = trimmed;
            }
        }
        if (given != null && !given.isBlank() && !given.equals(user.getFirstName())) {
            user.setFirstName(trimToDb(given, 64));
            changed = true;
        }
        if (family != null && !family.isBlank() && !family.equals(user.getLastName())) {
            user.setLastName(trimToDb(family, 64));
            changed = true;
        }
        String picture = stringClaim(payload, "picture");
        if (picture != null && !picture.isBlank()) {
            String normalized = picture.trim();
            if (!normalized.equals(user.getAvatarUrl())) {
                user.setAvatarUrl(normalized);
                changed = true;
            }
        }
        return changed;
    }

    private static String stringClaim(GoogleIdToken.Payload payload, String key) {
        Object v = payload.get(key);
        return v instanceof String s ? s : null;
    }

    private static String trimToDb(String value, int maxLen) {
        String t = value.trim();
        return t.length() <= maxLen ? t : t.substring(0, maxLen);
    }

    /**
     * Derives 6–15 digits from Google's subject so DB NOT NULL / CHECK and UNIQUE (prefix, number) hold for
     * accounts without a real phone.
     */
    static String syntheticPhoneNumberFromGoogleSub(String googleSub) {
        String digits = googleSub.replaceAll("\\D", "");
        if (digits.length() > 15) {
            digits = digits.substring(digits.length() - 15);
        }
        if (digits.length() >= 6) {
            return digits;
        }
        long h = Math.abs(googleSub.hashCode());
        String suffix = String.format("%06d", h % 1_000_000);
        String combined = digits + suffix;
        if (combined.length() > 15) {
            return combined.substring(combined.length() - 15);
        }
        return combined;
    }
}
