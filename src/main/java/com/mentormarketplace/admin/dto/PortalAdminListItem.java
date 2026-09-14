package com.mentormarketplace.admin.dto;

import com.mentormarketplace.admin.model.AdminPortalKind;
import java.time.Instant;
import java.util.UUID;

public record PortalAdminListItem(
        UUID id,
        String username,
        AdminPortalKind kind,
        boolean active,
        Instant createdAt
) {
}
