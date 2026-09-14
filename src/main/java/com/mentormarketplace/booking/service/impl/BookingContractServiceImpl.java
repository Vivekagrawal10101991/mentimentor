package com.mentormarketplace.booking.service.impl;

import com.mentormarketplace.booking.IdempotencyService;
import com.mentormarketplace.booking.dto.BookingResponse;
import com.mentormarketplace.booking.dto.CreateBookingRequest;
import com.mentormarketplace.booking.dto.StartBookingRequest;
import com.mentormarketplace.booking.dto.contract.BookingEnvelope;
import com.mentormarketplace.booking.dto.contract.CreateBookingContractRequest;
import com.mentormarketplace.booking.dto.contract.EndSessionData;
import com.mentormarketplace.booking.dto.contract.EndSessionEnvelope;
import com.mentormarketplace.booking.dto.contract.EndSessionRequest;
import com.mentormarketplace.booking.dto.contract.SessionStartData;
import com.mentormarketplace.booking.dto.contract.SessionStartEnvelope;
import com.mentormarketplace.booking.dto.contract.StartSessionOtpRequest;
import com.mentormarketplace.booking.model.Booking;
import com.mentormarketplace.booking.model.BookingStatus;
import com.mentormarketplace.booking.model.BookingType;
import com.mentormarketplace.booking.model.Payment;
import com.mentormarketplace.booking.model.PaymentStatus;
import com.mentormarketplace.booking.model.SessionMode;
import com.mentormarketplace.booking.repository.BookingRepository;
import com.mentormarketplace.booking.repository.PaymentRepository;
import com.mentormarketplace.booking.service.BookingContractMapper;
import com.mentormarketplace.booking.service.BookingContractService;
import com.mentormarketplace.booking.service.BookingService;
import com.mentormarketplace.common.exception.BadRequestException;
import com.mentormarketplace.common.exception.ResourceNotFoundException;
import com.mentormarketplace.config.PaymentProperties;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookingContractServiceImpl implements BookingContractService {

    private final BookingService bookingService;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentProperties paymentProperties;
    private final IdempotencyService idempotencyService;

    public BookingContractServiceImpl(
            BookingService bookingService,
            BookingRepository bookingRepository,
            PaymentRepository paymentRepository,
            PaymentProperties paymentProperties,
            IdempotencyService idempotencyService
    ) {
        this.bookingService = bookingService;
        this.bookingRepository = bookingRepository;
        this.paymentRepository = paymentRepository;
        this.paymentProperties = paymentProperties;
        this.idempotencyService = idempotencyService;
    }

    @Override
    @Transactional
    public BookingEnvelope createBooking(UUID menteeId, CreateBookingContractRequest request, String idempotencyKey) {
        Optional<UUID> existingId = idempotencyService.getExistingBookingId(idempotencyKey);
        if (existingId.isPresent()) {
            Booking existing = bookingRepository.findById(existingId.get())
                    .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + existingId.get()));
            return BookingContractMapper.toEnvelope(existing);
        }

        BookingType type = parseBookingType(request.bookingType());
        if (type == BookingType.SCHEDULED && request.scheduledStartTime() == null) {
            throw new BadRequestException("scheduledStartTime is required when bookingType=scheduled");
        }
        if (type == BookingType.INSTANT && request.scheduledStartTime() != null) {
            throw new BadRequestException("scheduledStartTime must be null for instant booking");
        }

        SessionMode mode = parseSessionMode(request.sessionMode());

        CreateBookingRequest legacy = new CreateBookingRequest(
                menteeId,
                request.mentorId(),
                type,
                request.scheduledStartTime()
        );
        BookingResponse created = bookingService.createBooking(legacy);

        Booking booking = bookingRepository.findById(created.id()).orElseThrow();
        booking.setPackageId(request.packageId());
        booking.setSessionMode(mode);
        booking.setNotes(request.notes());
        if (booking.getSessionStartOtpIssuedAt() == null) {
            booking.setSessionStartOtpIssuedAt(Instant.now());
        }
        bookingRepository.save(booking);

        idempotencyService.remember(idempotencyKey, booking.getId());
        return BookingContractMapper.toEnvelope(booking);
    }

    @Override
    @Transactional(readOnly = true)
    public BookingEnvelope getBooking(UUID bookingId, UUID userId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + bookingId));
        UUID menteeId = booking.getMentee().getId();
        UUID mentorUserId = booking.getMentor().getUser().getId();
        if (!Objects.equals(menteeId, userId) && !Objects.equals(mentorUserId, userId)) {
            throw new ResourceNotFoundException("Booking not found: " + bookingId);
        }
        return BookingContractMapper.toEnvelope(booking);
    }

    @Override
    @Transactional
    public SessionStartEnvelope startSessionWithOtp(UUID bookingId, UUID actorUserId, StartSessionOtpRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + bookingId));

        String role = request.actorRole().toLowerCase();
        if ("mentor".equals(role)) {
            if (!Objects.equals(booking.getMentor().getUser().getId(), actorUserId)) {
                throw new BadRequestException("actor does not match mentor for this booking");
            }
        } else if ("mentee".equals(role)) {
            if (!Objects.equals(booking.getMentee().getId(), actorUserId)) {
                throw new BadRequestException("actor does not match mentee for this booking");
            }
        } else {
            throw new BadRequestException("actorRole must be mentor or mentee");
        }

        StartBookingRequest legacy = new StartBookingRequest(
                bookingId,
                booking.getMentor().getId(),
                request.otpCode()
        );
        bookingService.startBooking(legacy);

        Booking updated = bookingRepository.findById(bookingId).orElseThrow();
        SessionStartData data = new SessionStartData(
                updated.getId(),
                BookingContractMapper.toApiStatus(updated.getStatus()),
                List.of(role),
                true,
                updated.getStartTime()
        );
        return new SessionStartEnvelope(data);
    }

    @Override
    @Transactional
    public EndSessionEnvelope endSession(UUID bookingId, UUID actorUserId, EndSessionRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + bookingId));

        String endedBy = request.endedBy().toLowerCase();
        if ("system".equals(endedBy)) {
            throw new BadRequestException("system-ended sessions are not supported via this API");
        }
        if ("mentor".equals(endedBy)) {
            if (!Objects.equals(booking.getMentor().getUser().getId(), actorUserId)) {
                throw new BadRequestException("endedBy mentor does not match authenticated user");
            }
        } else if ("mentee".equals(endedBy)) {
            if (!Objects.equals(booking.getMentee().getId(), actorUserId)) {
                throw new BadRequestException("endedBy mentee does not match authenticated user");
            }
        } else {
            throw new BadRequestException("endedBy must be mentor or mentee");
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
        paymentRepository.save(payment);

        int billedPaise = totalAmount.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).intValue();
        EndSessionData data = new EndSessionData(
                saved.getId(),
                "completed",
                saved.getEndTime(),
                billedPaise,
                "INR"
        );
        return new EndSessionEnvelope(data);
    }

    private static BookingType parseBookingType(String raw) {
        if (raw == null) {
            throw new BadRequestException("bookingType is required");
        }
        return switch (raw.toLowerCase()) {
            case "instant" -> BookingType.INSTANT;
            case "scheduled" -> BookingType.SCHEDULED;
            default -> throw new BadRequestException("bookingType must be instant or scheduled");
        };
    }

    private static SessionMode parseSessionMode(String raw) {
        if (raw == null) {
            throw new BadRequestException("sessionMode is required");
        }
        return switch (raw.toLowerCase()) {
            case "video" -> SessionMode.VIDEO;
            case "voice" -> SessionMode.VOICE;
            case "chat" -> SessionMode.CHAT;
            default -> throw new BadRequestException("sessionMode must be video, voice, or chat");
        };
    }
}
