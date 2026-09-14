package com.mentormarketplace.config;

import com.mentormarketplace.auth.sms.NoopOtpSmsSender;
import com.mentormarketplace.auth.sms.OtpSmsSender;
import com.mentormarketplace.auth.sms.TwilioOtpSmsSender;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OtpSmsConfiguration {

    @Bean
    public OtpSmsSender otpSmsSender(
            TwilioSmsProperties twilioSmsProperties,
            OtpProperties otpProperties
    ) {
        if (twilioSmsProperties.isConfigured()) {
            return new TwilioOtpSmsSender(
                    twilioSmsProperties,
                    otpProperties.logCodeToConsole()
            );
        }
        return new NoopOtpSmsSender();
    }
}
