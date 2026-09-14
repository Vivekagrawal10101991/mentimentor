package com.mentormarketplace.admin.controller;

import com.mentormarketplace.admin.dto.CreatePortalAdminRequest;
import com.mentormarketplace.admin.dto.PortalAdminListItem;
import com.mentormarketplace.admin.service.PortalAdminService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/admin/admins")
public class AdminPortalAccountController {

    private final PortalAdminService portalAdminService;

    public AdminPortalAccountController(PortalAdminService portalAdminService) {
        this.portalAdminService = portalAdminService;
    }

    @GetMapping
    public List<PortalAdminListItem> list() {
        return portalAdminService.listAdmins();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PortalAdminListItem create(@Valid @RequestBody CreatePortalAdminRequest body) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UUID actorId)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return portalAdminService.createAdmin(actorId, body);
    }
}
