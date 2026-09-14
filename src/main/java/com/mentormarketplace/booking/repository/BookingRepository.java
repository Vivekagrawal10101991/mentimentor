package com.mentormarketplace.booking.repository;

import com.mentormarketplace.booking.model.Booking;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingRepository extends JpaRepository<Booking, UUID> {
}
