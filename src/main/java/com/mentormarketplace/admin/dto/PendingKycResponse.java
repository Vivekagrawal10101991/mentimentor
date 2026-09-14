package com.mentormarketplace.admin.dto;

import java.util.List;

public record PendingKycResponse(
        List<ParentKycQueueItem> parentGuardianSubmissions,
        List<UserSelfKycQueueItem> adultSelfSubmissions
) {
}
