package com.mentormarketplace.parent.controller;

import com.mentormarketplace.parent.dto.AddParentDetailsRequest;
import com.mentormarketplace.parent.dto.ParentDetailsResponse;
import com.mentormarketplace.parent.dto.ParentOtpResponse;
import com.mentormarketplace.parent.dto.ParentOtpVerifyResponse;
import com.mentormarketplace.parent.dto.SendParentOtpRequest;
import com.mentormarketplace.parent.dto.VerifyParentOtpRequest;
import com.mentormarketplace.parent.service.ParentDetailsService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/parent")
public class ParentDetailsController {
    private final ParentDetailsService parentDetailsService;

    public ParentDetailsController(ParentDetailsService parentDetailsService) {
        this.parentDetailsService = parentDetailsService;
    }

    @PostMapping("/add-details")
    public ResponseEntity<ParentDetailsResponse> addDetails(@Valid @RequestBody AddParentDetailsRequest request) {
        return ResponseEntity.ok(parentDetailsService.addDetails(currentUserId(), request));
    }

    @PostMapping("/send-otp")
    public ResponseEntity<ParentOtpResponse> sendOtp(@Valid @RequestBody SendParentOtpRequest request) {
        return ResponseEntity.ok(parentDetailsService.sendOtp(currentUserId(), request.parentDetailsId()));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ParentOtpVerifyResponse> verifyOtp(@Valid @RequestBody VerifyParentOtpRequest request) {
        return ResponseEntity.ok(parentDetailsService.verifyOtp(currentUserId(), request.otpRequestId(), request.otpCode()));
    }

    private static UUID currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof UUID id)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return id;
    }
}
