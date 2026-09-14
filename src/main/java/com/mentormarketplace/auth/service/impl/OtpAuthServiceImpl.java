package com.mentormarketplace.auth.service.impl;

import com.mentormarketplace.auth.JwtTokenService;
import com.mentormarketplace.auth.dto.OtpVerifyResult;
import com.mentormarketplace.auth.dto.OtpDeliveryHint;
import com.mentormarketplace.auth.dto.SendOtpRequest;
import com.mentormarketplace.auth.dto.SendOtpResponse;
import com.mentormarketplace.auth.dto.VerifyOtpRequest;
import com.mentormarketplace.auth.repository.OtpRedisRepository;
import com.mentormarketplace.auth.service.OtpAuthService;
import com.mentormarketplace.auth.sms.OtpSmsSender;
import com.mentormarketplace.common.exception.InvalidOtpException;
import com.mentormarketplace.common.exception.OtpExpiredException;
import com.mentormarketplace.common.exception.OtpRetryLimitExceededException;
import com.mentormarketplace.config.AdminProperties;
import com.mentormarketplace.config.JwtProperties;
import com.mentormarketplace.config.OtpProperties;
import com.mentormarketplace.user.model.AccountRole;
import com.mentormarketplace.user.model.User;
import com.mentormarketplace.user.repository.UserRepository;
import com.mentormarketplace.user.support.PhonePrefixToIsoCountry;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class OtpAuthServiceImpl implements OtpAuthService {

    private static final Logger log = LoggerFactory.getLogger(OtpAuthServiceImpl.class);

    private static final String DEFAULT_ROLE = "mentee";

    private final OtpRedisRepository otpRedisRepository;
    private final UserRepository userRepository;
    private final OtpProperties otpProperties;
    private final JwtTokenService jwtTokenService;
    private final JwtProperties jwtProperties;
    private final OtpSmsSender otpSmsSender;
    private final AdminProperties adminProperties;

    private final SecureRandom secureRandom = new SecureRandom();

    public OtpAuthServiceImpl(
            OtpRedisRepository otpRedisRepository,
            UserRepository userRepository,
            OtpProperties otpProperties,
            JwtTokenService jwtTokenService,
            JwtProperties jwtProperties,
            OtpSmsSender otpSmsSender,
            AdminProperties adminProperties
    ) {
        this.otpRedisRepository = otpRedisRepository;
        this.userRepository = userRepository;
        this.otpProperties = otpProperties;
        this.jwtTokenService = jwtTokenService;
        this.jwtProperties = jwtProperties;
        this.otpSmsSender = otpSmsSender;
        this.adminProperties = adminProperties;
    }

    @Override
    public SendOtpResponse sendOtp(SendOtpRequest request) {
        UUID otpRequestId = UUID.randomUUID();
        int otpDigits = pickOtpDigits();
        String otpCode = generateOtpCode(otpDigits);

        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(otpProperties.ttlSeconds());

        OtpRedisRepository.OtpMeta meta = new OtpRedisRepository.OtpMeta(
                otpCode,
                otpRequestId,
                0,
                expiresAt,
                request.countryCode(),
                request.phoneNumber()
        );

        otpRedisRepository.save(otpRequestId, meta, Duration.ofSeconds(otpProperties.ttlSeconds()));

        if (otpProperties.logCodeToConsole()) {
            log.warn(
                    "OTP (dev log) {} {} -> {}",
                    request.countryCode(),
                    request.phoneNumber(),
                    otpCode
            );
        }

        otpSmsSender.sendLoginOtp(request.countryCode(), request.phoneNumber(), otpCode);

        if (!otpProperties.logCodeToConsole() && !otpSmsSender.sendsRealSms()) {
            log.debug(
                    "OTP stored; SMS not configured (Twilio env or OTP_LOG_CODE=true). {} {}",
                    request.countryCode(),
                    request.phoneNumber()
            );
        }

        OtpDeliveryHint deliveryHint = otpProperties.logCodeToConsole()
                ? OtpDeliveryHint.DEV_LOG
                : otpSmsSender.sendsRealSms()
                        ? OtpDeliveryHint.SMS
                        : OtpDeliveryHint.NONE;

        return new SendOtpResponse(otpRequestId, expiresAt, 0, deliveryHint);
    }

    @Override
    public OtpVerifyResult verifyOtp(VerifyOtpRequest request) {
        OtpRedisRepository.OtpMeta meta = otpRedisRepository
                .findByOtpRequestId(request.otpRequestId())
                .orElseThrow(() -> new OtpExpiredException("OTP expired or not found"));

        Instant now = Instant.now();
        if (meta.expiresAt() == null || meta.expiresAt().isBefore(now)) {
            otpRedisRepository.delete(request.otpRequestId());
            throw new OtpExpiredException("OTP expired");
        }

        int maxAttempts = otpProperties.maxAttempts();
        if (meta.attempts() >= maxAttempts) {
            throw new OtpRetryLimitExceededException("Retry limit exceeded", maxAttempts);
        }

        if (!meta.code().equals(request.otpCode())) {
            int nextAttempts = meta.attempts() + 1;
            Duration ttlLeft = otpRedisRepository.ttlLeft(request.otpRequestId());
            if (ttlLeft.isZero()) {
                otpRedisRepository.delete(request.otpRequestId());
                throw new OtpExpiredException("OTP expired");
            }
            if (nextAttempts >= maxAttempts) {
                otpRedisRepository.delete(request.otpRequestId());
                throw new OtpRetryLimitExceededException("Retry limit exceeded", maxAttempts);
            }

            OtpRedisRepository.OtpMeta updatedMeta = new OtpRedisRepository.OtpMeta(
                    meta.code(),
                    meta.otpRequestId(),
                    nextAttempts,
                    meta.expiresAt(),
                    meta.countryCode(),
                    meta.phoneNumber()
            );
            otpRedisRepository.save(request.otpRequestId(), updatedMeta, ttlLeft);
            throw new InvalidOtpException("Invalid OTP");
        }

        // OTP verified: consume OTP so it can't be reused.
        otpRedisRepository.delete(request.otpRequestId());

        User user = userRepository
                .findByCountryCodeAndPhoneNumber(meta.countryCode(), meta.phoneNumber())
                .orElseGet(() -> createUser(meta.countryCode(), meta.phoneNumber()));
        if (user.getIsoCountryCode() == null || user.getIsoCountryCode().isBlank()) {
            user.setIsoCountryCode(PhonePrefixToIsoCountry.isoAlpha2(user.getCountryCode()));
            user = userRepository.save(user);
        }
        user = applyAdminBootstrapIfNeeded(user, meta.countryCode(), meta.phoneNumber());

        String accessToken = jwtTokenService.createAccessToken(user.getId(), user.getRoles());
        String refreshToken = jwtTokenService.createRefreshToken(user.getId());
        long expiresIn = Math.max(60, jwtProperties.accessTokenTtl().toSeconds());

        return new OtpVerifyResult(user, accessToken, refreshToken, expiresIn);
    }

    private User createUser(String countryCode, String phoneNumber) {
        User user = new User();
        user.setCountryCode(countryCode);
        user.setPhoneNumber(phoneNumber);
        user.setIsoCountryCode(PhonePrefixToIsoCountry.isoAlpha2(countryCode));
        user.setAccountRole(AccountRole.mentee);
        user.setRoles(new ArrayList<>(List.of(DEFAULT_ROLE)));
        return userRepository.save(user);
    }

    private User applyAdminBootstrapIfNeeded(User user, String countryCode, String phoneNumber) {
        if (!adminProperties.isBootstrapAdmin(countryCode, phoneNumber)) {
            return user;
        }
        List<String> roles = user.getRoles();
        if (roles == null) {
            roles = new ArrayList<>();
            user.setRoles(roles);
        }
        if (!roles.contains("admin")) {
            roles.add("admin");
            return userRepository.save(user);
        }
        return user;
    }

    private int pickOtpDigits() {
        // Requirement: 4–6 digits. Choose within that range each time.
        int min = Math.max(4, otpProperties.minDigits());
        int max = Math.min(6, otpProperties.maxDigits());
        if (min > max) {
            return 6;
        }
        return ThreadLocalRandom.current().nextInt(min, max + 1);
    }

    private String generateOtpCode(int digits) {
        int lower = (int) Math.pow(10, digits - 1);
        int upper = (int) Math.pow(10, digits) - 1;
        int otp = secureRandom.nextInt(upper - lower + 1) + lower;
        return String.valueOf(otp);
    }
}

