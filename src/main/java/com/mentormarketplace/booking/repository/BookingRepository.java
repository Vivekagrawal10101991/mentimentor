package com.mentormarketplace.booking.repository;

import com.mentormarketplace.booking.model.Booking;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingRepository extends JpaRepository<Booking, UUID> {

    List<Booking> findByMentee_Id(UUID menteeId);

    List<Booking> findByMentor_Id(UUID mentorId);
}
