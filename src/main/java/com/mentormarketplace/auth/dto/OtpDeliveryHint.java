package com.mentormarketplace.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public enum OtpDeliveryHint {
    @JsonProperty("sms")
    SMS,
    @JsonProperty("dev_log")
    DEV_LOG,
    @JsonProperty("none")
    NONE
}
