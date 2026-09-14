package com.mentormarketplace.auth.sms;

public interface OtpSmsSender {

    /** Whether real SMS is sent (Twilio configured). */
    boolean sendsRealSms();

    void sendLoginOtp(String countryCode, String phoneNumber, String otpCode);
}
