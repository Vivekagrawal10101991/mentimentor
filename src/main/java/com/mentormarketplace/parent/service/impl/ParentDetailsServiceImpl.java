package com.mentormarketplace.parent.service.impl;

import com.mentormarketplace.auth.sms.OtpSmsSender;
import com.mentormarketplace.common.exception.BadRequestException;
import com.mentormarketplace.common.exception.InvalidOtpException;
import com.mentormarketplace.common.exception.OtpExpiredException;
import com.mentormarketplace.parent.dto.AddParentDetailsRequest;
import com.mentormarketplace.parent.dto.ParentDetailsResponse;
import com.mentormarketplace.parent.dto.ParentOtpResponse;
import com.mentormarketplace.parent.dto.ParentOtpVerifyResponse;
import com.mentormarketplace.common.model.KycStatus;
import com.mentormarketplace.parent.model.ParentDetails;
import com.mentormarketplace.parent.repository.ParentDetailsRepository;
import com.mentormarketplace.parent.repository.ParentOtpRedisRepository;
import com.mentormarketplace.parent.service.ParentDetailsService;
import com.mentormarketplace.user.model.User;
import com.mentormarketplace.user.repository.UserRepository;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ParentDetailsServiceImpl implements ParentDetailsService {
    private static final int OTP_TTL_SECONDS = 300;
    private final SecureRandom secureRandom = new SecureRandom();
    private final UserRepository userRepository;
    private final ParentDetailsRepository parentDetailsRepository;
    private final ParentOtpRedisRepository parentOtpRedisRepository;
    private final OtpSmsSender otpSmsSender;

    public ParentDetailsServiceImpl(
            UserRepository userRepository,
            ParentDetailsRepository parentDetailsRepository,
            ParentOtpRedisRepository parentOtpRedisRepository,
            OtpSmsSender otpSmsSender
    ) {
        this.userRepository = userRepository;
        this.parentDetailsRepository = parentDetailsRepository;
        this.parentOtpRedisRepository = parentOtpRedisRepository;
        this.otpSmsSender = otpSmsSender;
    }

    @Override
    @Transactional
    public ParentDetailsResponse addDetails(UUID userId, AddParentDetailsRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));
        if (!user.isMinor()) {
            throw new BadRequestException("Parent details are only required for minors");
        }
        ParentDetails details = new ParentDetails();
        details.setUser(user);
        details.setParentName(request.parentName());
        details.setParentPhone(request.parentPhone());
        details.setParentAadharNumber(request.parentAadharNumber());
        details.setKycStatus(KycStatus.PENDING);
        ParentDetails saved = parentDetailsRepository.save(details);
        return toResponse(saved);
    }

    @Override
    public ParentOtpResponse sendOtp(UUID userId, UUID parentDetailsId) {
        ParentDetails details = parentDetailsRepository.findById(parentDetailsId)
                .orElseThrow(() -> new BadRequestException("Parent details not found"));
        if (!details.getUser().getId().equals(userId)) {
            throw new BadRequestException("Parent details do not belong to current user");
        }
        String otpCode = String.valueOf(1000 + secureRandom.nextInt(9000));
        UUID otpRequestId = UUID.randomUUID();
        Instant expiresAt = Instant.now().plusSeconds(OTP_TTL_SECONDS);
        parentOtpRedisRepository.save(
                otpRequestId,
                new ParentOtpRedisRepository.ParentOtpMeta(
                        details.getId(),
                        otpRequestId,
                        details.getParentPhone(),
                        otpCode,
                        0,
                        expiresAt
                ),
                Duration.ofSeconds(OTP_TTL_SECONDS)
        );
        otpSmsSender.sendLoginOtp("+91", details.getParentPhone(), otpCode);
        return new ParentOtpResponse(otpRequestId, expiresAt);
    }

    @Override
    @Transactional
    public ParentOtpVerifyResponse verifyOtp(UUID userId, UUID otpRequestId, String otpCode) {
        ParentOtpRedisRepository.ParentOtpMeta meta = parentOtpRedisRepository.findByOtpRequestId(otpRequestId)
                .orElseThrow(() -> new OtpExpiredException("OTP expired or not found"));
        if (meta.expiresAt() == null || meta.expiresAt().isBefore(Instant.now())) {
            parentOtpRedisRepository.delete(otpRequestId);
            throw new OtpExpiredException("OTP expired");
        }
        ParentDetails details = parentDetailsRepository.findById(meta.parentDetailsId())
                .orElseThrow(() -> new BadRequestException("Parent details not found"));
        if (!details.getUser().getId().equals(userId)) {
            throw new BadRequestException("Parent details do not belong to current user");
        }
        if (!meta.code().equals(otpCode)) {
            throw new InvalidOtpException("Invalid OTP");
        }
        details.setKycStatus(KycStatus.SUBMITTED);
        parentDetailsRepository.save(details);
        parentOtpRedisRepository.delete(otpRequestId);
        return new ParentOtpVerifyResponse(details.getId(), details.getKycStatus().name());
    }

    private ParentDetailsResponse toResponse(ParentDetails d) {
        return new ParentDetailsResponse(
                d.getId(),
                d.getUser().getId(),
                d.getParentName(),
                d.getParentPhone(),
                d.getParentAadharNumber(),
                d.getKycStatus().name()
        );
    }
}
