package com.mentormarketplace.auth.sms;

public final class NoopOtpSmsSender implements OtpSmsSender {

    @Override
    public boolean sendsRealSms() {
        return false;
    }

    @Override
    public void sendLoginOtp(String countryCode, String phoneNumber, String otpCode) {
        // No SMS provider; OTP is only in Redis (and optionally server logs).
    }
}
