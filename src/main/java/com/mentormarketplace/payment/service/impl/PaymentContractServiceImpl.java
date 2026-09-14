package com.mentormarketplace.payment.service.impl;

import com.mentormarketplace.booking.IdempotencyService;
import com.mentormarketplace.booking.model.Payment;
import com.mentormarketplace.booking.repository.PaymentRepository;
import com.mentormarketplace.common.exception.BadRequestException;
import com.mentormarketplace.common.exception.ResourceNotFoundException;
import com.mentormarketplace.payment.dto.contract.CreateRefundRequest;
import com.mentormarketplace.payment.dto.contract.ListPaymentsEnvelope;
import com.mentormarketplace.payment.dto.contract.PaginationData;
import com.mentormarketplace.payment.dto.contract.PaymentEnvelope;
import com.mentormarketplace.payment.dto.contract.RefundData;
import com.mentormarketplace.payment.dto.contract.RefundEnvelope;
import com.mentormarketplace.payment.model.Refund;
import com.mentormarketplace.payment.model.RefundStatus;
import com.mentormarketplace.payment.repository.RefundRepository;
import com.mentormarketplace.payment.service.PaymentContractMapper;
import com.mentormarketplace.payment.service.PaymentContractService;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentContractServiceImpl implements PaymentContractService {

    private final PaymentRepository paymentRepository;
    private final RefundRepository refundRepository;
    private final IdempotencyService idempotencyService;

    public PaymentContractServiceImpl(
            PaymentRepository paymentRepository,
            RefundRepository refundRepository,
            IdempotencyService idempotencyService
    ) {
        this.paymentRepository = paymentRepository;
        this.refundRepository = refundRepository;
        this.idempotencyService = idempotencyService;
    }

    @Override
    @Transactional(readOnly = true)
    public ListPaymentsEnvelope listPayments(UUID payerUserId, int page, int pageSize) {
        Page<Payment> result = paymentRepository.findByBookingMenteeId(
                payerUserId,
                PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        List<com.mentormarketplace.payment.dto.contract.PaymentData> rows =
                result.getContent().stream().map(PaymentContractMapper::toData).toList();
        PaginationData pagination = new PaginationData(
                page,
                pageSize,
                result.getTotalElements(),
                result.getTotalPages()
        );
        return new ListPaymentsEnvelope(rows, pagination);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentEnvelope getPayment(UUID paymentId, UUID userId) {
        Payment p = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + paymentId));
        if (!Objects.equals(p.getBooking().getMentee().getId(), userId)) {
            throw new ResourceNotFoundException("Payment not found: " + paymentId);
        }
        return new PaymentEnvelope(PaymentContractMapper.toData(p));
    }

    @Override
    @Transactional
    public RefundEnvelope createRefund(UUID paymentId, UUID userId, CreateRefundRequest request, String idempotencyKey) {
        Optional<UUID> existingRefund = idempotencyService.getExistingRefundId(idempotencyKey);
        if (existingRefund.isPresent()) {
            Refund r = refundRepository.findById(existingRefund.get())
                    .orElseThrow(() -> new ResourceNotFoundException("Refund not found: " + existingRefund.get()));
            return new RefundEnvelope(toRefundData(r));
        }

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + paymentId));
        if (!Objects.equals(payment.getBooking().getMentee().getId(), userId)) {
            throw new ResourceNotFoundException("Payment not found: " + paymentId);
        }

        int maxPaise = PaymentContractMapper.toPaise(payment.getAmount());
        if (request.amount() > maxPaise) {
            throw new BadRequestException("Refund amount exceeds payment amount");
        }

        Refund refund = new Refund();
        refund.setPayment(payment);
        refund.setAmount(request.amount());
        refund.setCurrency(payment.getCurrency());
        refund.setReason(request.reason());
        refund.setStatus(RefundStatus.succeeded);
        Refund saved = refundRepository.save(refund);
        idempotencyService.rememberRefund(idempotencyKey, saved.getId());
        return new RefundEnvelope(toRefundData(saved));
    }

    private static RefundData toRefundData(Refund r) {
        return new RefundData(
                r.getId(),
                r.getPayment().getId(),
                r.getAmount(),
                r.getCurrency(),
                r.getReason(),
                r.getStatus().name(),
                r.getCreatedAt()
        );
    }
}
