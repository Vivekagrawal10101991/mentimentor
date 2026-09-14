package com.mentormarketplace.payment.dto.contract;

import java.util.List;

public record ListPaymentsEnvelope(List<PaymentData> data, PaginationData pagination) {
}
