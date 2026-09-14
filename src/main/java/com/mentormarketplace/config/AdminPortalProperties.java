package com.mentormarketplace.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Bootstrap the first {@link com.mentormarketplace.admin.model.AdminPortalKind#SUPER_ADMIN} when the table is empty.
 * Set both username and password (min 8 chars) in environment for first-time setup, then rotate credentials in production.
 */
@ConfigurationProperties(prefix = "app.admin-portal")
public record AdminPortalProperties(String superAdminUsername, String superAdminPassword) {

    public boolean bootstrapConfigured() {
        return superAdminUsername != null
                && !superAdminUsername.isBlank()
                && superAdminPassword != null
                && superAdminPassword.length() >= 8;
    }
}
