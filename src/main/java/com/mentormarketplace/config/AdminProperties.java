package com.mentormarketplace.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Optional bootstrap: grant {@code admin} JWT role when OTP login matches a configured phone key.
 * Format: comma-separated entries {@code +country|nationalDigits}, e.g. {@code +91|7667238456}.
 */
@ConfigurationProperties(prefix = "app.admin")
public record AdminProperties(String bootstrapPhones) {

    public boolean isBootstrapAdmin(String countryCode, String nationalDigits) {
        if (bootstrapPhones == null || bootstrapPhones.isBlank()) {
            return false;
        }
        String key = normalizeKey(countryCode, nationalDigits);
        for (String raw : bootstrapPhones.split(",")) {
            if (normalizeKeyFromEntry(raw.trim()).equals(key)) {
                return true;
            }
        }
        return false;
    }

    private static String normalizeKey(String countryCode, String nationalDigits) {
        String cc = countryCode == null ? "" : countryCode.trim();
        if (!cc.startsWith("+")) {
            cc = "+" + cc.replaceFirst("^\\+", "");
        }
        String digits = nationalDigits == null ? "" : nationalDigits.replaceAll("\\D", "");
        return cc + "|" + digits;
    }

    private static String normalizeKeyFromEntry(String entry) {
        String e = entry.replace(":", "|").trim();
        if (!e.contains("|")) {
            return e;
        }
        int pipe = e.indexOf('|');
        String cc = e.substring(0, pipe).trim();
        String num = e.substring(pipe + 1).trim().replaceAll("\\D", "");
        return normalizeKey(cc, num);
    }
}
