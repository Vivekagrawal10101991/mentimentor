package com.mentormarketplace.booking.repository;

import com.mentormarketplace.booking.model.Payment;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    Optional<Payment> findTopByBooking_IdOrderByCreatedAtDesc(UUID bookingId);

    Optional<Payment> findByPaymentReference(String paymentReference);

    Page<Payment> findByBookingMenteeId(UUID menteeId, Pageable pageable);

    List<Payment> findByBooking_IdIn(Collection<UUID> bookingIds);
}
