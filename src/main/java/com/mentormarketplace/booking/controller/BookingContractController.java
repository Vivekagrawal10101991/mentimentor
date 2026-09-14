package com.mentormarketplace.booking.controller;

import com.mentormarketplace.booking.dto.contract.BookingEnvelope;
import com.mentormarketplace.booking.dto.contract.CreateBookingContractRequest;
import com.mentormarketplace.booking.dto.contract.EndSessionEnvelope;
import com.mentormarketplace.booking.dto.contract.EndSessionRequest;
import com.mentormarketplace.booking.dto.contract.SessionStartEnvelope;
import com.mentormarketplace.booking.dto.contract.StartSessionOtpRequest;
import com.mentormarketplace.booking.service.BookingContractService;
import com.mentormarketplace.common.exception.BadRequestException;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/bookings")
public class BookingContractController {

    private final BookingContractService bookingContractService;

    public BookingContractController(BookingContractService bookingContractService) {
        this.bookingContractService = bookingContractService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<BookingEnvelope> createBooking(
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody CreateBookingContractRequest request
    ) {
        if (idempotencyKey == null || idempotencyKey.length() < 8 || idempotencyKey.length() > 128) {
            throw new BadRequestException("Idempotency-Key header must be between 8 and 128 characters");
        }
        UUID menteeId = currentUserId();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bookingContractService.createBooking(menteeId, request, idempotencyKey));
    }

    @GetMapping("/{bookingId}")
    public ResponseEntity<BookingEnvelope> getBooking(@PathVariable UUID bookingId) {
        return ResponseEntity.ok(bookingContractService.getBooking(bookingId, currentUserId()));
    }

    @PostMapping("/{bookingId}/session-start-otp")
    public ResponseEntity<SessionStartEnvelope> startSession(
            @PathVariable UUID bookingId,
            @Valid @RequestBody StartSessionOtpRequest request
    ) {
        return ResponseEntity.ok(
                bookingContractService.startSessionWithOtp(bookingId, currentUserId(), request)
        );
    }

    @PostMapping("/{bookingId}/end")
    public ResponseEntity<EndSessionEnvelope> endSession(
            @PathVariable UUID bookingId,
            @Valid @RequestBody EndSessionRequest request
    ) {
        return ResponseEntity.ok(bookingContractService.endSession(bookingId, currentUserId(), request));
    }

    private static UUID currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof UUID id)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return id;
    }
}
