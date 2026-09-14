package com.mentormarketplace.admin.service;

import com.mentormarketplace.admin.dto.PendingKycResponse;
import java.util.UUID;

public interface AdminKycService {

    PendingKycResponse listPending();

    void approveParentSubmission(UUID parentDetailsId);

    void rejectParentSubmission(UUID parentDetailsId, String reason);

    void approveUserSelfKyc(UUID userId);

    void rejectUserSelfKyc(UUID userId, String reason);
}
