package com.mentormarketplace.common.exception;

public class UnauthorizedCredentialsException extends RuntimeException {

    public UnauthorizedCredentialsException(String message) {
        super(message);
    }
}
