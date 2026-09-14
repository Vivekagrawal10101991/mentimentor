package com.mentormarketplace.booking.service.impl;

import com.mentormarketplace.booking.dto.BookingResponse;
import com.mentormarketplace.booking.dto.CreateBookingRequest;
import com.mentormarketplace.booking.dto.EndBookingRequest;
import com.mentormarketplace.booking.dto.EndBookingResponse;
import com.mentormarketplace.booking.dto.StartBookingRequest;
import com.mentormarketplace.booking.model.Booking;
import com.mentormarketplace.booking.model.BookingStatus;
import com.mentormarketplace.booking.model.BookingType;
import com.mentormarketplace.booking.model.Payment;
import com.mentormarketplace.booking.model.PaymentStatus;
import com.mentormarketplace.booking.repository.BookingOtpRedisRepository;
import com.mentormarketplace.booking.repository.BookingRepository;
import com.mentormarketplace.booking.repository.PaymentRepository;
import com.mentormarketplace.booking.service.BookingService;
import com.mentormarketplace.common.exception.BadRequestException;
import com.mentormarketplace.common.exception.ResourceNotFoundException;
import com.mentormarketplace.config.PaymentProperties;
import com.mentormarketplace.mentor.model.Mentor;
import com.mentormarketplace.mentor.repository.MentorRepository;
import com.mentormarketplace.user.model.User;
import com.mentormarketplace.user.repository.UserRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Objects;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookingServiceImpl implements BookingService {

    private static final Duration SESSION_OTP_TTL = Duration.ofMinutes(5);

    private final BookingRepository bookingRepository;
    private final BookingOtpRedisRepository bookingOtpRedisRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentProperties paymentProperties;
    private final UserRepository userRepository;
    private final MentorRepository mentorRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public BookingServiceImpl(
            BookingRepository bookingRepository,
            BookingOtpRedisRepository bookingOtpRedisRepository,
            PaymentRepository paymentRepository,
            PaymentProperties paymentProperties,
            UserRepository userRepository,
            MentorRepository mentorRepository
    ) {
        this.bookingRepository = bookingRepository;
        this.bookingOtpRedisRepository = bookingOtpRedisRepository;
        this.paymentRepository = paymentRepository;
        this.paymentProperties = paymentProperties;
        this.userRepository = userRepository;
        this.mentorRepository = mentorRepository;
    }

    @Override
    public BookingResponse createBooking(CreateBookingRequest request) {
        User mentee = userRepository.findById(request.menteeId())
                .orElseThrow(() -> new ResourceNotFoundException("Mentee not found: " + request.menteeId()));
        Mentor mentor = mentorRepository.findById(request.mentorId())
                .orElseThrow(() -> new ResourceNotFoundException("Mentor not found: " + request.mentorId()));

        validateBookingInput(request);

        Booking booking = new Booking();
        booking.setMentee(mentee);
        booking.setMentor(mentor);
        booking.setType(request.type());
        booking.setScheduledTime(request.type() == BookingType.SCHEDULED ? request.scheduledTime() : null);
        booking.setStatus(BookingStatus.payment_pending);
        String sessionOtp = generateOtp();
        booking.setSessionStartOtp(sessionOtp);
        booking.setSessionStartOtpExpiresAt(Instant.now().plus(SESSION_OTP_TTL));
        booking.setSessionStartOtpIssuedAt(Instant.now());

        Booking saved = bookingRepository.save(booking);
        bookingOtpRedisRepository.saveOtp(saved.getId(), sessionOtp, SESSION_OTP_TTL);

        return new BookingResponse(
                saved.getId(),
                saved.getMentee().getId(),
                saved.getMentor().getId(),
                saved.getType(),
                saved.getScheduledTime(),
                saved.getStartTime(),
                saved.getStatus(),
                saved.getCreatedAt(),
                saved.getUpdatedAt()
        );
    }

    @Override
    public BookingResponse startBooking(StartBookingRequest request) {
        Booking booking = bookingRepository.findById(request.bookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + request.bookingId()));

        if (!Objects.equals(booking.getMentor().getId(), request.mentorId())) {
            throw new BadRequestException("mentor_id does not belong to this booking");
        }
        if (booking.getStatus() != BookingStatus.payment_pending && booking.getStatus() != BookingStatus.confirmed) {
            throw new BadRequestException("Booking cannot be started in status: " + booking.getStatus());
        }

        Instant now = Instant.now();
        if (booking.getSessionStartOtpExpiresAt() == null || booking.getSessionStartOtpExpiresAt().isBefore(now)) {
            booking.setStatus(BookingStatus.failed);
            bookingRepository.save(booking);
            bookingOtpRedisRepository.deleteOtp(booking.getId());
            throw new BadRequestException("OTP expired");
        }

        String expectedOtp = bookingOtpRedisRepository.getOtp(booking.getId()).orElse(booking.getSessionStartOtp());
        if (expectedOtp == null || !expectedOtp.equals(request.otp())) {
            booking.setStatus(BookingStatus.failed);
            bookingRepository.save(booking);
            bookingOtpRedisRepository.deleteOtp(booking.getId());
            throw new BadRequestException("Invalid OTP");
        }

        booking.setStartTime(now);
        booking.setStatus(BookingStatus.started);
        booking.setSessionStartOtp(null);
        booking.setSessionStartOtpExpiresAt(null);
        Booking saved = bookingRepository.save(booking);
        bookingOtpRedisRepository.deleteOtp(saved.getId());

        return new BookingResponse(
                saved.getId(),
                saved.getMentee().getId(),
                saved.getMentor().getId(),
                saved.getType(),
                saved.getScheduledTime(),
                saved.getStartTime(),
                saved.getStatus(),
                saved.getCreatedAt(),
                saved.getUpdatedAt()
        );
    }

    @Override
    @Transactional
    public EndBookingResponse endBooking(EndBookingRequest request) {
        Booking booking = bookingRepository.findById(request.bookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + request.bookingId()));

        if (!Objects.equals(booking.getMentor().getId(), request.mentorId())) {
            throw new BadRequestException("mentor_id does not belong to this booking");
        }
        if (booking.getStatus() != BookingStatus.started) {
            throw new BadRequestException("Booking must be started to end session; current status: " + booking.getStatus());
        }
        if (booking.getStartTime() == null) {
            throw new BadRequestException("Session has no start_time");
        }
        if (booking.getEndTime() != null) {
            throw new BadRequestException("Session already ended");
        }
        if (paymentRepository.findTopByBooking_IdOrderByCreatedAtDesc(booking.getId()).isPresent()) {
            throw new BadRequestException("Payment already recorded for this booking");
        }

        Instant endTime = Instant.now();
        long durationSeconds = Duration.between(booking.getStartTime(), endTime).getSeconds();
        if (durationSeconds < 0) {
            throw new BadRequestException("Invalid session duration");
        }

        BigDecimal hourlyRate = booking.getMentor().getHourlyRate();
        BigDecimal durationHours = BigDecimal.valueOf(durationSeconds)
                .divide(BigDecimal.valueOf(3600L), 10, RoundingMode.HALF_UP);
        BigDecimal totalAmount = hourlyRate.multiply(durationHours).setScale(2, RoundingMode.HALF_UP);

        booking.setEndTime(endTime);
        booking.setDurationSeconds(durationSeconds);
        booking.setTotalAmount(totalAmount);
        booking.setStatus(BookingStatus.completed);
        Booking saved = bookingRepository.save(booking);

        Payment payment = new Payment();
        payment.setBooking(saved);
        payment.setAmount(totalAmount);
        payment.setCurrency("INR");
        BigDecimal feePercent = paymentProperties.platformFeePercent();
        BigDecimal platformFeeAmount = totalAmount
                .multiply(feePercent)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal mentorAmount = totalAmount.subtract(platformFeeAmount).setScale(2, RoundingMode.HALF_UP);
        payment.setPlatformFeePercent(feePercent);
        payment.setPlatformFeeAmount(platformFeeAmount);
        payment.setMentorAmount(mentorAmount);
        payment.setStatus(PaymentStatus.INITIATED);
        payment.setPaymentReference("pay_" + saved.getId().toString().replace("-", ""));
        Payment savedPayment = paymentRepository.save(payment);

        return new EndBookingResponse(
                saved.getId(),
                saved.getEndTime(),
                durationSeconds,
                hourlyRate,
                totalAmount,
                savedPayment.getId(),
                savedPayment.getCurrency(),
                saved.getStatus()
        );
    }

    private void validateBookingInput(CreateBookingRequest request) {
        if (request.type() == BookingType.SCHEDULED) {
            if (request.scheduledTime() == null) {
                throw new BadRequestException("scheduled_time is required for SCHEDULED booking");
            }
            if (request.scheduledTime().isBefore(Instant.now())) {
                throw new BadRequestException("scheduled_time must be in the future");
            }
            return;
        }

        if (request.type() == BookingType.INSTANT && request.scheduledTime() != null) {
            throw new BadRequestException("scheduled_time must be null for INSTANT booking");
        }
    }

    private String generateOtp() {
        int otp = secureRandom.nextInt(900000) + 100000;
        return String.valueOf(otp);
    }
}
