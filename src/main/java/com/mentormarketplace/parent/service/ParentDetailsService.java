package com.mentormarketplace.parent.service;

import com.mentormarketplace.parent.dto.AddParentDetailsRequest;
import com.mentormarketplace.parent.dto.ParentDetailsResponse;
import com.mentormarketplace.parent.dto.ParentOtpResponse;
import com.mentormarketplace.parent.dto.ParentOtpVerifyResponse;
import java.util.UUID;

public interface ParentDetailsService {
    ParentDetailsResponse addDetails(UUID userId, AddParentDetailsRequest request);
    ParentOtpResponse sendOtp(UUID userId, UUID parentDetailsId);
    ParentOtpVerifyResponse verifyOtp(UUID userId, UUID otpRequestId, String otpCode);
}
