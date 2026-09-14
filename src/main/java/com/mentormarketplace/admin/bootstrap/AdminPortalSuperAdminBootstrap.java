package com.mentormarketplace.admin.bootstrap;

import com.mentormarketplace.admin.model.AdminPortalKind;
import com.mentormarketplace.admin.model.PortalAdmin;
import com.mentormarketplace.admin.repository.PortalAdminRepository;
import com.mentormarketplace.config.AdminPortalProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(50)
public class AdminPortalSuperAdminBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminPortalSuperAdminBootstrap.class);

    private final PortalAdminRepository portalAdminRepository;
    private final AdminPortalProperties adminPortalProperties;
    private final PasswordEncoder passwordEncoder;

    public AdminPortalSuperAdminBootstrap(
            PortalAdminRepository portalAdminRepository,
            AdminPortalProperties adminPortalProperties,
            PasswordEncoder passwordEncoder
    ) {
        this.portalAdminRepository = portalAdminRepository;
        this.adminPortalProperties = adminPortalProperties;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (portalAdminRepository.countByKind(AdminPortalKind.SUPER_ADMIN) > 0) {
            return;
        }
        if (!adminPortalProperties.bootstrapConfigured()) {
            log.info(
                    "No portal super admin in database. Set app.admin-portal.super-admin-username and "
                            + "super-admin-password (8+ chars) to create one on startup, or insert via SQL."
            );
            return;
        }
        String username = adminPortalProperties.superAdminUsername().trim().toLowerCase();
        if (portalAdminRepository.existsByUsernameIgnoreCase(username)) {
            log.warn("Bootstrap skipped: username {} already exists but is not marked SUPER_ADMIN", username);
            return;
        }
        PortalAdmin root = new PortalAdmin();
        root.setUsername(username);
        root.setPasswordHash(passwordEncoder.encode(adminPortalProperties.superAdminPassword()));
        root.setKind(AdminPortalKind.SUPER_ADMIN);
        portalAdminRepository.save(root);
        log.warn(
                "Created initial portal SUPER_ADMIN '{}'. Change this password after first login in production.",
                username
        );
    }
}
