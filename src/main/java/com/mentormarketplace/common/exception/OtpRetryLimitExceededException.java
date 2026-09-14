package com.mentormarketplace.common.exception;

public class OtpRetryLimitExceededException extends RuntimeException {

    private final int maxAttempts;

    public OtpRetryLimitExceededException(String message, int maxAttempts) {
        super(message);
        this.maxAttempts = maxAttempts;
    }

    public int getMaxAttempts() {
        return maxAttempts;
    }
}

