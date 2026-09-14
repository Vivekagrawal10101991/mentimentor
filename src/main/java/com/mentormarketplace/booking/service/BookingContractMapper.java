package com.mentormarketplace.booking.service;

import com.mentormarketplace.booking.dto.contract.BookingData;
import com.mentormarketplace.booking.dto.contract.BookingEnvelope;
import com.mentormarketplace.booking.dto.contract.PricingBreakdownData;
import com.mentormarketplace.booking.model.Booking;
import com.mentormarketplace.booking.model.BookingStatus;
import com.mentormarketplace.booking.model.BookingType;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

public final class BookingContractMapper {

    private BookingContractMapper() {
    }

    public static BookingEnvelope toEnvelope(Booking b) {
        return new BookingEnvelope(toData(b));
    }

    public static BookingData toData(Booking b) {
        Instant start = b.getStartTime() != null
                ? b.getStartTime()
                : (b.getScheduledTime() != null ? b.getScheduledTime() : b.getCreatedAt());
        Instant end = b.getEndTime() != null
                ? b.getEndTime()
                : start.plus(1, ChronoUnit.HOURS);

        int payable = estimatePayablePaise(b);
        PricingBreakdownData pricing = new PricingBreakdownData(payable, 0, payable, "INR");

        String sessionMode = b.getSessionMode() != null ? b.getSessionMode().name().toLowerCase() : "video";

        return new BookingData(
                b.getId(),
                b.getMentee().getId(),
                b.getMentor().getId(),
                b.getPackageId(),
                b.getType() == BookingType.INSTANT ? "instant" : "scheduled",
                sessionMode,
                toApiStatus(b.getStatus()),
                start,
                end,
                pricing,
                b.getSessionStartOtpIssuedAt(),
                b.getSessionStartOtpExpiresAt(),
                b.getCreatedAt(),
                b.getUpdatedAt()
        );
    }

    public static String toApiStatus(BookingStatus status) {
        return status.name();
    }

    public static int estimatePayablePaise(Booking b) {
        BigDecimal hourly = b.getMentor().getHourlyRate();
        if (hourly == null) {
            return 0;
        }
        BigDecimal rupees = hourly.setScale(2, RoundingMode.HALF_UP);
        return rupees.multiply(BigDecimal.valueOf(100)).intValue();
    }
}
