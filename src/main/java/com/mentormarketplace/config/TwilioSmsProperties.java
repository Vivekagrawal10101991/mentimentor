package com.mentormarketplace.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.sms.twilio")
public record TwilioSmsProperties(String accountSid, String authToken, String fromNumber) {

    public TwilioSmsProperties {
        accountSid = accountSid == null ? "" : accountSid.trim();
        authToken = authToken == null ? "" : authToken.trim();
        fromNumber = fromNumber == null ? "" : fromNumber.trim();
    }

    public boolean isConfigured() {
        return !accountSid.isBlank()
                && !authToken.isBlank()
                && !fromNumber.isBlank();
    }
}
