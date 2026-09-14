package com.mentormarketplace.booking.service;

import com.mentormarketplace.booking.dto.BookingResponse;
import com.mentormarketplace.booking.dto.CreateBookingRequest;
import com.mentormarketplace.booking.dto.EndBookingRequest;
import com.mentormarketplace.booking.dto.EndBookingResponse;
import com.mentormarketplace.booking.dto.StartBookingRequest;

public interface BookingService {

    BookingResponse createBooking(CreateBookingRequest request);

    BookingResponse startBooking(StartBookingRequest request);

    EndBookingResponse endBooking(EndBookingRequest request);
}
