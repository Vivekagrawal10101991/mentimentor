package com.mentormarketplace.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.otp")
public record OtpProperties(
        int ttlSeconds,
        int minDigits,
        int maxDigits,
        int maxAttempts,
        /**
         * When true, logs OTP codes to the server console (local dev only).
         */
        boolean logCodeToConsole
) {
}

