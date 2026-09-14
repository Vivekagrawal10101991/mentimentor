package com.mentormarketplace.payment.service.impl;

import com.mentormarketplace.booking.model.Booking;
import com.mentormarketplace.booking.model.BookingStatus;
import com.mentormarketplace.booking.model.Payment;
import com.mentormarketplace.booking.model.PaymentStatus;
import com.mentormarketplace.booking.repository.BookingRepository;
import com.mentormarketplace.booking.repository.PaymentRepository;
import com.mentormarketplace.common.exception.BadRequestException;
import com.mentormarketplace.common.exception.ResourceNotFoundException;
import com.mentormarketplace.config.PaymentProperties;
import com.mentormarketplace.mentor.model.Mentor;
import com.mentormarketplace.mentor.repository.MentorRepository;
import com.mentormarketplace.payment.dto.PaymentConfirmRequest;
import com.mentormarketplace.payment.dto.PaymentConfirmResponse;
import com.mentormarketplace.payment.dto.PaymentInitiateRequest;
import com.mentormarketplace.payment.dto.PaymentInitiateResponse;
import com.mentormarketplace.payment.model.PaymentTransaction;
import com.mentormarketplace.payment.model.PaymentTransactionType;
import com.mentormarketplace.payment.repository.PaymentTransactionRepository;
import com.mentormarketplace.payment.service.PaymentService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentServiceImpl implements PaymentService {

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final MentorRepository mentorRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final PaymentProperties paymentProperties;

    public PaymentServiceImpl(
            BookingRepository bookingRepository,
            PaymentRepository paymentRepository,
            MentorRepository mentorRepository,
            PaymentTransactionRepository paymentTransactionRepository,
            PaymentProperties paymentProperties
    ) {
        this.bookingRepository = bookingRepository;
        this.paymentRepository = paymentRepository;
        this.mentorRepository = mentorRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.paymentProperties = paymentProperties;
    }

    @Override
    @Transactional
    public PaymentInitiateResponse initiatePayment(PaymentInitiateRequest request) {
        Booking booking = bookingRepository.findById(request.bookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + request.bookingId()));

        if (booking.getTotalAmount() == null || booking.getTotalAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Booking has no payable amount; end session before initiating payment");
        }
        if (booking.getStatus() != BookingStatus.completed) {
            throw new BadRequestException("Booking must be COMPLETED before initiating payment");
        }

        Payment payment = paymentRepository.findTopByBooking_IdOrderByCreatedAtDesc(booking.getId())
                .orElseGet(() -> createPaymentForBooking(booking));

        if (payment.getStatus() == PaymentStatus.SUCCESS || payment.getStatus() == PaymentStatus.COMPLETED) {
            throw new BadRequestException("Payment is already successful for this booking");
        }

        if (payment.getStatus() != PaymentStatus.INITIATED) {
            payment.setStatus(PaymentStatus.INITIATED);
            payment = paymentRepository.save(payment);
        }

        recordTransaction(payment, PaymentTransactionType.INITIATE, null);

        return new PaymentInitiateResponse(
                payment.getId(),
                booking.getId(),
                payment.getPaymentReference(),
                payment.getAmount(),
                payment.getPlatformFeePercent(),
                payment.getPlatformFeeAmount(),
                payment.getMentorAmount(),
                payment.getStatus()
        );
    }

    @Override
    @Transactional
    public PaymentConfirmResponse confirmPayment(PaymentConfirmRequest request) {
        Payment payment = paymentRepository.findById(request.paymentId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + request.paymentId()));

        if (payment.getStatus() == PaymentStatus.SUCCESS || payment.getStatus() == PaymentStatus.COMPLETED) {
            return new PaymentConfirmResponse(
                    payment.getId(),
                    payment.getPaymentReference(),
                    payment.getProviderTransactionId(),
                    payment.getStatus(),
                    payment.getBooking().getMentor().getWalletBalance(),
                    payment.getConfirmedAt()
            );
        }

        if (payment.getStatus() != PaymentStatus.INITIATED) {
            throw new BadRequestException("Payment is not in INITIATED state");
        }

        Mentor mentor = payment.getBooking().getMentor();
        BigDecimal walletBalance = mentor.getWalletBalance() == null ? BigDecimal.ZERO : mentor.getWalletBalance();
        mentor.setWalletBalance(walletBalance.add(payment.getMentorAmount()).setScale(2, RoundingMode.HALF_UP));
        mentorRepository.save(mentor);

        payment.setProviderTransactionId(request.providerTransactionId());
        payment.setConfirmedAt(Instant.now());
        payment.setStatus(PaymentStatus.SUCCESS);
        Payment saved = paymentRepository.save(payment);

        recordTransaction(saved, PaymentTransactionType.CONFIRM, request.providerTransactionId());

        return new PaymentConfirmResponse(
                saved.getId(),
                saved.getPaymentReference(),
                saved.getProviderTransactionId(),
                saved.getStatus(),
                mentor.getWalletBalance(),
                saved.getConfirmedAt()
        );
    }

    private Payment createPaymentForBooking(Booking booking) {
        BigDecimal amount = booking.getTotalAmount().setScale(2, RoundingMode.HALF_UP);
        BigDecimal feePercent = paymentProperties.platformFeePercent().setScale(2, RoundingMode.HALF_UP);
        BigDecimal platformFeeAmount = amount
                .multiply(feePercent)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal mentorAmount = amount.subtract(platformFeeAmount).setScale(2, RoundingMode.HALF_UP);

        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setAmount(amount);
        payment.setCurrency("INR");
        payment.setPlatformFeePercent(feePercent);
        payment.setPlatformFeeAmount(platformFeeAmount);
        payment.setMentorAmount(mentorAmount);
        payment.setStatus(PaymentStatus.INITIATED);
        payment.setPaymentReference("pay_" + booking.getId().toString().replace("-", ""));
        return paymentRepository.save(payment);
    }

    private void recordTransaction(Payment payment, PaymentTransactionType type, String providerTransactionId) {
        PaymentTransaction transaction = new PaymentTransaction();
        transaction.setPayment(payment);
        transaction.setType(type);
        transaction.setAmount(payment.getAmount());
        transaction.setProviderTransactionId(providerTransactionId);
        paymentTransactionRepository.save(transaction);
    }
}
