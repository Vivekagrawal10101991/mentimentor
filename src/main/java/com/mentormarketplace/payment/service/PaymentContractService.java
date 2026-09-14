package com.mentormarketplace.payment.service;

import com.mentormarketplace.payment.dto.contract.CreateRefundRequest;
import com.mentormarketplace.payment.dto.contract.ListPaymentsEnvelope;
import com.mentormarketplace.payment.dto.contract.PaymentEnvelope;
import com.mentormarketplace.payment.dto.contract.RefundEnvelope;
import java.util.UUID;

public interface PaymentContractService {

    ListPaymentsEnvelope listPayments(UUID payerUserId, int page, int pageSize);

    PaymentEnvelope getPayment(UUID paymentId, UUID userId);

    RefundEnvelope createRefund(UUID paymentId, UUID userId, CreateRefundRequest request, String idempotencyKey);
}
