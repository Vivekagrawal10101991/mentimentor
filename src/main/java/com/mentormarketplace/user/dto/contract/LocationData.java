package com.mentormarketplace.user.dto.contract;

public record LocationData(
        String city,
        String state,
        String country,
        Double lat,
        Double lng,
        String formattedAddress,
        String pinCode
) {
}
