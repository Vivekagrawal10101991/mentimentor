package com.mentormarketplace.user.service;

import java.util.UUID;

public interface AccountDeletionService {

    /** Permanently deletes the authenticated user's account and related data. */
    void deleteMyAccount(UUID userId);
}
