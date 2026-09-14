package com.mentormarketplace.booking.service;

import com.mentormarketplace.booking.dto.contract.BookingEnvelope;
import com.mentormarketplace.booking.dto.contract.CreateBookingContractRequest;
import com.mentormarketplace.booking.dto.contract.EndSessionEnvelope;
import com.mentormarketplace.booking.dto.contract.EndSessionRequest;
import com.mentormarketplace.booking.dto.contract.SessionStartEnvelope;
import com.mentormarketplace.booking.dto.contract.StartSessionOtpRequest;
import java.util.UUID;

public interface BookingContractService {

    BookingEnvelope createBooking(UUID menteeId, CreateBookingContractRequest request, String idempotencyKey);

    BookingEnvelope getBooking(UUID bookingId, UUID userId);

    SessionStartEnvelope startSessionWithOtp(UUID bookingId, UUID actorUserId, StartSessionOtpRequest request);

    EndSessionEnvelope endSession(UUID bookingId, UUID actorUserId, EndSessionRequest request);
}
