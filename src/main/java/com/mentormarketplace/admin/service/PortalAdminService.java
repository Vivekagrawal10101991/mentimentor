package com.mentormarketplace.admin.service;

import com.mentormarketplace.admin.dto.CreatePortalAdminRequest;
import com.mentormarketplace.admin.dto.PortalAdminListItem;
import com.mentormarketplace.auth.dto.VerifyOtpContractResponse;
import java.util.List;
import java.util.UUID;

public interface PortalAdminService {

    VerifyOtpContractResponse login(String username, String password);

    PortalAdminListItem createAdmin(UUID actorId, CreatePortalAdminRequest request);

    List<PortalAdminListItem> listAdmins();
}
