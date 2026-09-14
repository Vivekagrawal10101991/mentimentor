package com.mentormarketplace.auth.service;

import com.mentormarketplace.auth.dto.OtpVerifyResult;
import com.mentormarketplace.auth.dto.SendOtpRequest;
import com.mentormarketplace.auth.dto.SendOtpResponse;
import com.mentormarketplace.auth.dto.VerifyOtpRequest;

public interface OtpAuthService {

    SendOtpResponse sendOtp(SendOtpRequest request);

    OtpVerifyResult verifyOtp(VerifyOtpRequest request);
}

