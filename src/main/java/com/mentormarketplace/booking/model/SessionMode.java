package com.mentormarketplace.booking.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public enum SessionMode {
    @JsonProperty("video")
    VIDEO,
    @JsonProperty("voice")
    VOICE,
    @JsonProperty("chat")
    CHAT
}
