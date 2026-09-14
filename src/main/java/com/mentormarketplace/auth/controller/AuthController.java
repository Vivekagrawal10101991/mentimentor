package com.mentormarketplace.auth.controller;

import com.mentormarketplace.admin.service.PortalAdminService;
import com.mentormarketplace.auth.dto.AdminPasswordLoginRequest;
import com.mentormarketplace.auth.dto.GoogleAuthRequest;
import com.mentormarketplace.auth.dto.SendOtpRequest;
import com.mentormarketplace.auth.dto.SendOtpResponse;
import com.mentormarketplace.auth.dto.UserSummary;
import com.mentormarketplace.auth.dto.VerifyOtpContractResponse;
import com.mentormarketplace.auth.dto.VerifyOtpRequest;
import com.mentormarketplace.auth.dto.VerifyOtpResponse;
import com.mentormarketplace.auth.service.GoogleAuthService;
import com.mentormarketplace.auth.service.OtpAuthService;
import com.mentormarketplace.user.dto.UserProfileDto;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final OtpAuthService otpAuthService;
    private final GoogleAuthService googleAuthService;
    private final PortalAdminService portalAdminService;

    public AuthController(
            OtpAuthService otpAuthService,
            GoogleAuthService googleAuthService,
            PortalAdminService portalAdminService
    ) {
        this.otpAuthService = otpAuthService;
        this.googleAuthService = googleAuthService;
        this.portalAdminService = portalAdminService;
    }

    @PostMapping("/admin/login")
    public ResponseEntity<VerifyOtpContractResponse> adminPortalLogin(
            @Valid @RequestBody AdminPasswordLoginRequest request
    ) {
        log.info("Admin portal password login for username={}", request.username());
        return ResponseEntity.ok(portalAdminService.login(request.username(), request.password()));
    }

    @PostMapping("/google")
    public ResponseEntity<VerifyOtpContractResponse> signInWithGoogle(
            @Valid @RequestBody GoogleAuthRequest request
    ) {
        return ResponseEntity.ok(googleAuthService.signIn(request.credential()));
    }

    @PostMapping({"/send-otp", "/otp/send"})
    public ResponseEntity<SendOtpResponse> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        log.info("Sending OTP for countryCode={} phoneNumber={}", request.countryCode(), request.phoneNumber());
        return ResponseEntity.ok(otpAuthService.sendOtp(request));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<VerifyOtpResponse> verifyOtpLegacy(@Valid @RequestBody VerifyOtpRequest request) {
        log.info("Verifying OTP for otpRequestId={}", request.otpRequestId());
        var result = otpAuthService.verifyOtp(request);
        var profile = new UserProfileDto(
                result.user().getId(),
                result.user().getPhoneNumber(),
                result.user().getCountryCode(),
                result.user().getRoles(),
                result.user().getCreatedAt(),
                result.user().getUpdatedAt()
        );
        return ResponseEntity.ok(new VerifyOtpResponse(profile));
    }

    @PostMapping("/otp/verify")
    public ResponseEntity<VerifyOtpContractResponse> verifyOtpContract(@Valid @RequestBody VerifyOtpRequest request) {
        log.info("Verifying OTP (contract) for otpRequestId={}", request.otpRequestId());
        var result = otpAuthService.verifyOtp(request);
        return ResponseEntity.ok(
                new VerifyOtpContractResponse(
                        result.accessToken(),
                        result.refreshToken(),
                        "Bearer",
                        result.expiresInSeconds(),
                        UserSummary.fromUser(result.user())
                )
        );
    }
}

