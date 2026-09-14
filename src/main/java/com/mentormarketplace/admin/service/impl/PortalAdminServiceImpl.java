package com.mentormarketplace.admin.service.impl;

import com.mentormarketplace.admin.dto.CreatePortalAdminRequest;
import com.mentormarketplace.admin.dto.PortalAdminListItem;
import com.mentormarketplace.admin.model.AdminPortalKind;
import com.mentormarketplace.admin.model.PortalAdmin;
import com.mentormarketplace.admin.repository.PortalAdminRepository;
import com.mentormarketplace.admin.service.PortalAdminService;
import com.mentormarketplace.auth.JwtTokenService;
import com.mentormarketplace.auth.dto.UserSummary;
import com.mentormarketplace.auth.dto.VerifyOtpContractResponse;
import com.mentormarketplace.common.exception.BadRequestException;
import com.mentormarketplace.common.exception.ResourceNotFoundException;
import com.mentormarketplace.common.exception.UnauthorizedCredentialsException;
import com.mentormarketplace.config.JwtProperties;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PortalAdminServiceImpl implements PortalAdminService {

    private final PortalAdminRepository portalAdminRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;
    private final JwtProperties jwtProperties;

    public PortalAdminServiceImpl(
            PortalAdminRepository portalAdminRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenService jwtTokenService,
            JwtProperties jwtProperties
    ) {
        this.portalAdminRepository = portalAdminRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenService = jwtTokenService;
        this.jwtProperties = jwtProperties;
    }

    @Override
    @Transactional(readOnly = true)
    public VerifyOtpContractResponse login(String username, String password) {
        String key = username == null ? "" : username.trim().toLowerCase();
        PortalAdmin admin = portalAdminRepository
                .findByUsernameIgnoreCase(key)
                .orElseThrow(() -> new UnauthorizedCredentialsException("Invalid username or password"));
        if (!admin.isActive()) {
            throw new UnauthorizedCredentialsException("Invalid username or password");
        }
        if (!passwordEncoder.matches(password, admin.getPasswordHash())) {
            throw new UnauthorizedCredentialsException("Invalid username or password");
        }
        List<String> roles = jwtRolesFor(admin);
        String accessToken = jwtTokenService.createAccessToken(admin.getId(), roles);
        String refreshToken = jwtTokenService.createRefreshToken(admin.getId());
        long expiresIn = Math.max(60, jwtProperties.accessTokenTtl().toSeconds());
        return new VerifyOtpContractResponse(
                accessToken,
                refreshToken,
                "Bearer",
                expiresIn,
                UserSummary.fromPortalAdmin(admin)
        );
    }

    @Override
    @Transactional
    public PortalAdminListItem createAdmin(UUID actorId, CreatePortalAdminRequest request) {
        PortalAdmin actor = portalAdminRepository
                .findById(actorId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));
        if (!actor.isActive() || actor.getKind() != AdminPortalKind.SUPER_ADMIN) {
            throw new BadRequestException("Only an active super admin can create portal admins");
        }
        String uname = request.username().trim().toLowerCase();
        if (portalAdminRepository.existsByUsernameIgnoreCase(uname)) {
            throw new BadRequestException("Username already taken");
        }
        PortalAdmin created = new PortalAdmin();
        created.setUsername(uname);
        created.setPasswordHash(passwordEncoder.encode(request.password()));
        created.setKind(AdminPortalKind.ADMIN);
        created.setCreatedById(actor.getId());
        portalAdminRepository.save(created);
        return toListItem(created);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PortalAdminListItem> listAdmins() {
        return portalAdminRepository.findAll().stream()
                .map(PortalAdminServiceImpl::toListItem)
                .sorted(Comparator.comparing(PortalAdminListItem::createdAt).reversed())
                .toList();
    }

    private static List<String> jwtRolesFor(PortalAdmin admin) {
        List<String> roles = new ArrayList<>();
        if (admin.getKind() == AdminPortalKind.SUPER_ADMIN) {
            roles.add("super_admin");
        }
        roles.add("admin");
        return roles;
    }

    private static PortalAdminListItem toListItem(PortalAdmin a) {
        return new PortalAdminListItem(
                a.getId(),
                a.getUsername(),
                a.getKind(),
                a.isActive(),
                a.getCreatedAt()
        );
    }
}
