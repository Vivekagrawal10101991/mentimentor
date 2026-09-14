package com.mentormarketplace.user.service;

import com.mentormarketplace.user.dto.dashboard.UserDashboardResponse;
import java.util.UUID;

public interface UserDashboardService {
    UserDashboardResponse getDashboard(UUID userId);
}
