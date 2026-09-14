package com.mentormarketplace.admin.controller;

import com.mentormarketplace.admin.dto.KycRejectRequest;
import com.mentormarketplace.admin.dto.PendingKycResponse;
import com.mentormarketplace.admin.service.AdminKycService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/kyc")
public class AdminKycController {

    private final AdminKycService adminKycService;

    public AdminKycController(AdminKycService adminKycService) {
        this.adminKycService = adminKycService;
    }

    @GetMapping("/pending")
    public ResponseEntity<PendingKycResponse> pending() {
        return ResponseEntity.ok(adminKycService.listPending());
    }

    @PostMapping("/parent/{parentDetailsId}/approve")
    public ResponseEntity<Void> approveParent(@PathVariable UUID parentDetailsId) {
        adminKycService.approveParentSubmission(parentDetailsId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/parent/{parentDetailsId}/reject")
    public ResponseEntity<Void> rejectParent(
            @PathVariable UUID parentDetailsId,
            @Valid @RequestBody(required = false) KycRejectRequest body
    ) {
        adminKycService.rejectParentSubmission(
                parentDetailsId,
                body != null && body.reason() != null ? body.reason() : ""
        );
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/user-self/{userId}/approve")
    public ResponseEntity<Void> approveSelf(@PathVariable UUID userId) {
        adminKycService.approveUserSelfKyc(userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/user-self/{userId}/reject")
    public ResponseEntity<Void> rejectSelf(
            @PathVariable UUID userId,
            @Valid @RequestBody(required = false) KycRejectRequest body
    ) {
        adminKycService.rejectUserSelfKyc(
                userId,
                body != null && body.reason() != null ? body.reason() : ""
        );
        return ResponseEntity.noContent().build();
    }
}
