package com.mentormarketplace.admin.repository;

import com.mentormarketplace.admin.model.AdminPortalKind;
import com.mentormarketplace.admin.model.PortalAdmin;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PortalAdminRepository extends JpaRepository<PortalAdmin, UUID> {

    Optional<PortalAdmin> findByUsernameIgnoreCase(String username);

    boolean existsByUsernameIgnoreCase(String username);

    long countByKind(AdminPortalKind kind);
}
