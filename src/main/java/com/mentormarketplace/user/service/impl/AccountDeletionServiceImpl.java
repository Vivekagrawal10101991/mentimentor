package com.mentormarketplace.user.service.impl;

import com.mentormarketplace.booking.model.Booking;
import com.mentormarketplace.booking.model.Payment;
import com.mentormarketplace.booking.repository.BookingRepository;
import com.mentormarketplace.booking.repository.PaymentRepository;
import com.mentormarketplace.common.exception.ResourceNotFoundException;
import com.mentormarketplace.mentor.availability.repository.MentorAvailabilityRedisRepository;
import com.mentormarketplace.mentor.availability.repository.MentorAvailabilitySnapshotRepository;
import com.mentormarketplace.mentor.model.Mentor;
import com.mentormarketplace.mentor.repository.MentorRepository;
import com.mentormarketplace.parent.repository.ParentDetailsRepository;
import com.mentormarketplace.payment.repository.PaymentTransactionRepository;
import com.mentormarketplace.payment.repository.RefundRepository;
import com.mentormarketplace.request.model.LearningRequest;
import com.mentormarketplace.request.repository.LearningRequestRepository;
import com.mentormarketplace.user.model.User;
import com.mentormarketplace.user.repository.MenteeInterestRepository;
import com.mentormarketplace.user.repository.UserProfileRepository;
import com.mentormarketplace.user.repository.UserRepository;
import com.mentormarketplace.user.service.AccountDeletionService;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountDeletionServiceImpl implements AccountDeletionService {

    private static final Logger log = LoggerFactory.getLogger(AccountDeletionServiceImpl.class);

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final MenteeInterestRepository menteeInterestRepository;
    private final ParentDetailsRepository parentDetailsRepository;
    private final LearningRequestRepository learningRequestRepository;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final RefundRepository refundRepository;
    private final MentorRepository mentorRepository;
    private final MentorAvailabilitySnapshotRepository mentorAvailabilitySnapshotRepository;
    private final MentorAvailabilityRedisRepository mentorAvailabilityRedisRepository;

    public AccountDeletionServiceImpl(
            UserRepository userRepository,
            UserProfileRepository userProfileRepository,
            MenteeInterestRepository menteeInterestRepository,
            ParentDetailsRepository parentDetailsRepository,
            LearningRequestRepository learningRequestRepository,
            BookingRepository bookingRepository,
            PaymentRepository paymentRepository,
            PaymentTransactionRepository paymentTransactionRepository,
            RefundRepository refundRepository,
            MentorRepository mentorRepository,
            MentorAvailabilitySnapshotRepository mentorAvailabilitySnapshotRepository,
            MentorAvailabilityRedisRepository mentorAvailabilityRedisRepository
    ) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.menteeInterestRepository = menteeInterestRepository;
        this.parentDetailsRepository = parentDetailsRepository;
        this.learningRequestRepository = learningRequestRepository;
        this.bookingRepository = bookingRepository;
        this.paymentRepository = paymentRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.refundRepository = refundRepository;
        this.mentorRepository = mentorRepository;
        this.mentorAvailabilitySnapshotRepository = mentorAvailabilitySnapshotRepository;
        this.mentorAvailabilityRedisRepository = mentorAvailabilityRedisRepository;
    }

    @Override
    @Transactional
    public void deleteMyAccount(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        Mentor mentor = mentorRepository.findByUserId(userId).orElse(null);

        Set<UUID> bookingIds = new HashSet<>();
        List<Booking> asMentee = bookingRepository.findByMentee_Id(userId);
        asMentee.forEach(b -> bookingIds.add(b.getId()));
        if (mentor != null) {
            bookingRepository.findByMentor_Id(mentor.getId()).forEach(b -> bookingIds.add(b.getId()));
        }

        if (!bookingIds.isEmpty()) {
            List<Payment> payments = paymentRepository.findByBooking_IdIn(bookingIds);
            List<UUID> paymentIds = payments.stream().map(Payment::getId).toList();
            if (!paymentIds.isEmpty()) {
                refundRepository.deleteByPayment_IdIn(paymentIds);
                paymentTransactionRepository.deleteByPayment_IdIn(paymentIds);
                paymentRepository.deleteAll(payments);
            }
            List<Booking> bookings = new ArrayList<>();
            bookings.addAll(asMentee);
            if (mentor != null) {
                bookings.addAll(bookingRepository.findByMentor_Id(mentor.getId()));
            }
            // Deduplicate bookings that may appear in both lists
            Set<UUID> seen = new HashSet<>();
            List<Booking> unique = new ArrayList<>();
            for (Booking b : bookings) {
                if (seen.add(b.getId())) {
                    unique.add(b);
                }
            }
            bookingRepository.deleteAll(unique);
        }

        learningRequestRepository.deleteByMentee_Id(userId);
        if (mentor != null) {
            List<LearningRequest> assigned = learningRequestRepository.findByAssignedMentor_Id(mentor.getId());
            for (LearningRequest request : assigned) {
                request.setAssignedMentor(null);
            }
            learningRequestRepository.saveAll(assigned);
        }

        parentDetailsRepository.deleteByUser_Id(userId);
        menteeInterestRepository.deleteByUser_Id(userId);
        userProfileRepository.deleteByUser_Id(userId);

        if (mentor != null) {
            mentorAvailabilitySnapshotRepository.deleteByMentorId(mentor.getId());
            try {
                mentorAvailabilityRedisRepository.upsertLiveStatus(mentor.getId(), false, null, null, null);
            } catch (Exception e) {
                log.warn("Failed to clear Redis availability for mentor {}: {}", mentor.getId(), e.getMessage());
            }
            mentorRepository.delete(mentor);
        }

        userRepository.delete(user);
        log.info("Deleted account for user {}", userId);
    }
}
