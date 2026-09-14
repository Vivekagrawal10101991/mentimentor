package com.mentormarketplace.payment.dto.contract;

public record PaginationData(int page, int pageSize, long total, int totalPages) {
}
