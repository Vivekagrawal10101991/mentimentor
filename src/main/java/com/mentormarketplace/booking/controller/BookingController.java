package com.mentormarketplace.booking.controller;

import com.mentormarketplace.booking.dto.BookingResponse;
import com.mentormarketplace.booking.dto.CreateBookingRequest;
import com.mentormarketplace.booking.dto.EndBookingRequest;
import com.mentormarketplace.booking.dto.EndBookingResponse;
import com.mentormarketplace.booking.dto.StartBookingRequest;
import com.mentormarketplace.booking.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/booking")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping("/create")
    public ResponseEntity<BookingResponse> createBooking(@Valid @RequestBody CreateBookingRequest request) {
        return ResponseEntity.ok(bookingService.createBooking(request));
    }

    @PostMapping("/start")
    public ResponseEntity<BookingResponse> startBooking(@Valid @RequestBody StartBookingRequest request) {
        return ResponseEntity.ok(bookingService.startBooking(request));
    }

    @PostMapping("/end")
    public ResponseEntity<EndBookingResponse> endBooking(@Valid @RequestBody EndBookingRequest request) {
        return ResponseEntity.ok(bookingService.endBooking(request));
    }
}
