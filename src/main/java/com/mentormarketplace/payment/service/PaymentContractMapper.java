package com.mentormarketplace.payment.service;

import com.mentormarketplace.booking.model.Payment;
import com.mentormarketplace.booking.model.PaymentStatus;
import com.mentormarketplace.payment.dto.contract.CommissionBreakdownData;
import com.mentormarketplace.payment.dto.contract.PaymentData;
import java.math.BigDecimal;
import java.math.RoundingMode;

public final class PaymentContractMapper {

    private PaymentContractMapper() {
    }

    public static PaymentData toData(Payment p) {
        int amountPaise = toPaise(p.getAmount());
        BigDecimal feePct = p.getPlatformFeePercent();
        int platformPaise = toPaise(p.getPlatformFeeAmount());
        int mentorPaise = toPaise(p.getMentorAmount());
        float takeRate = feePct == null ? 0f : feePct.floatValue();

        CommissionBreakdownData commission = new CommissionBreakdownData(takeRate, platformPaise, mentorPaise);

        return new PaymentData(
                p.getId(),
                p.getBooking().getId(),
                p.getBooking().getMentee().getId(),
                amountPaise,
                p.getCurrency(),
                toApiStatus(p.getStatus()),
                p.getProvider(),
                p.getPaymentReference(),
                commission,
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }

    public static String toApiStatus(PaymentStatus status) {
        if (status == null) {
            return "pending";
        }
        return switch (status) {
            case INITIATED -> "pending";
            case SUCCESS, COMPLETED -> "captured";
            case FAILED -> "failed";
        };
    }

    public static int toPaise(BigDecimal rupees) {
        if (rupees == null) {
            return 0;
        }
        return rupees.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).intValue();
    }
}
