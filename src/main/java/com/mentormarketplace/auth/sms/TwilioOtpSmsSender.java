package com.mentormarketplace.auth.sms;

import com.mentormarketplace.common.exception.SmsDeliveryException;
import com.mentormarketplace.config.TwilioSmsProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

public final class TwilioOtpSmsSender implements OtpSmsSender {

    private static final Logger log = LoggerFactory.getLogger(TwilioOtpSmsSender.class);

    private final TwilioSmsProperties properties;
    private final boolean logCodeToConsole;
    private final RestClient restClient = RestClient.create();

    public TwilioOtpSmsSender(TwilioSmsProperties properties, boolean logCodeToConsole) {
        this.properties = properties;
        this.logCodeToConsole = logCodeToConsole;
    }

    @Override
    public boolean sendsRealSms() {
        return true;
    }

    @Override
    public void sendLoginOtp(String countryCode, String phoneNumber, String otpCode) {
        String to = toE164(countryCode, phoneNumber);
        String accountSid = properties.accountSid();
        String authToken = properties.authToken();
        String from = properties.fromNumber();
        if (digitsOnly(to).equals(digitsOnly(from))) {
            if (logCodeToConsole) {
                log.debug(
                        "Skipping Twilio SMS (From equals To, Twilio error 21266); OTP was already logged."
                );
            } else {
                log.warn(
                        "Skipping Twilio SMS: From and To are the same number (Twilio would return 21266). "
                                + "Set OTP_LOG_CODE=true to print the OTP in server logs, or use a different "
                                + "login phone than TWILIO_FROM_NUMBER."
                );
            }
            return;
        }
        String url =
                "https://api.twilio.com/2010-04-01/Accounts/" + accountSid + "/Messages.json";

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("To", to);
        form.add("From", from);
        form.add("Body", "Your verification code is: " + otpCode);

        try {
            restClient
                    .post()
                    .uri(url)
                    .headers(h -> {
                        h.setBasicAuth(accountSid, authToken);
                        h.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
                    })
                    .body(form)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException ex) {
            log.error(
                    "Twilio SMS failed: status={} body={}",
                    ex.getStatusCode(),
                    ex.getResponseBodyAsString()
            );
            if (ex.getStatusCode().value() == 401) {
                throw new SmsDeliveryException(
                        "Twilio rejected credentials (401 / 20003). Copy the Auth Token from "
                                + "Twilio Console → Account → API keys & tokens (use the main Auth Token, "
                                + "not a random secret). Ensure TWILIO_ACCOUNT_SID matches the same account "
                                + "and values in .env have no extra spaces or quotes.",
                        ex
                );
            }
            throw new SmsDeliveryException("SMS could not be sent. Try again later.", ex);
        } catch (Exception ex) {
            log.error("Twilio SMS request failed", ex);
            throw new SmsDeliveryException("SMS could not be sent. Try again later.", ex);
        }
    }

    private static String digitsOnly(String e164OrRaw) {
        if (e164OrRaw == null) {
            return "";
        }
        return e164OrRaw.replaceAll("\\D", "");
    }

    static String toE164(String countryCode, String phoneNumber) {
        String cc = countryCode == null ? "" : countryCode.trim();
        String national = phoneNumber == null ? "" : phoneNumber.trim();
        if (!cc.startsWith("+")) {
            cc = "+" + cc;
        }
        return cc + national;
    }
}
