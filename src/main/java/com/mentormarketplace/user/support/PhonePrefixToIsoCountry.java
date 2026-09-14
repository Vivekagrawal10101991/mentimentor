package com.mentormarketplace.user.support;

/**
 * Best-effort mapping from E.164 calling prefix to ISO 3166-1 alpha-2 for {@code users.country_code}.
 */
public final class PhonePrefixToIsoCountry {

    private PhonePrefixToIsoCountry() {}

    /**
     * @param callingCodePrefix e.g. {@code +91}, {@code +1}, or synthetic {@code +999}
     * @return ISO alpha-2, or {@code XX} when unknown / reserved OAuth-only prefix
     */
    public static String isoAlpha2(String callingCodePrefix) {
        if (callingCodePrefix == null || callingCodePrefix.isBlank()) {
            return "XX";
        }
        String p = callingCodePrefix.trim();
        return switch (p) {
            case "+91" -> "IN";
            case "+1" -> "US";
            case "+44" -> "GB";
            case "+61" -> "AU";
            case "+81" -> "JP";
            case "+86" -> "CN";
            case "+49" -> "DE";
            case "+33" -> "FR";
            case "+55" -> "BR";
            case "+52" -> "MX";
            case "+234" -> "NG";
            case "+27" -> "ZA";
            case "+82" -> "KR";
            case "+65" -> "SG";
            case "+971" -> "AE";
            case "+999" -> "XX";
            default -> "XX";
        };
    }
}
