package com.mentormarketplace.booking.model;

/**
 * Labels match PostgreSQL {@code booking_status} enum (see {@code Repo_detail.sql}).
 */
public enum BookingStatus {
    created,
    payment_pending,
    confirmed,
    started,
    completed,
    cancelled,
    failed,
    mentor_no_show,
    mentee_no_show
}
