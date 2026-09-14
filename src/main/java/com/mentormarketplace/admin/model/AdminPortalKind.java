package com.mentormarketplace.admin.model;

/**
 * Portal operator accounts (username/password). Distinct from {@code users.role = admin}.
 */
public enum AdminPortalKind {
    SUPER_ADMIN,
    ADMIN
}
