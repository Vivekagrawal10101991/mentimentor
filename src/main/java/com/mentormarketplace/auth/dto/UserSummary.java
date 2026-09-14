package com.mentormarketplace.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.mentormarketplace.admin.model.AdminPortalKind;
import com.mentormarketplace.admin.model.PortalAdmin;
import com.mentormarketplace.user.model.User;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public record UserSummary(
        UUID id,
        String phoneNumber,
        @JsonProperty("roles") List<String> roles
) {
    public static UserSummary fromUser(User user) {
        List<String> roles = user.getRoles().stream().map(String::toLowerCase).toList();
        String phone = user.getPhoneNumber();
        if (phone == null || phone.isBlank()) {
            phone = user.getEmail() != null ? user.getEmail() : "";
        }
        return new UserSummary(user.getId(), phone, roles);
    }

    /** Portal admin login: {@code phoneNumber} carries the username for API contract compatibility. */
    public static UserSummary fromPortalAdmin(PortalAdmin admin) {
        List<String> roles = new ArrayList<>();
        if (admin.getKind() == AdminPortalKind.SUPER_ADMIN) {
            roles.add("super_admin");
        }
        roles.add("admin");
        return new UserSummary(admin.getId(), admin.getUsername(), roles);
    }
}
