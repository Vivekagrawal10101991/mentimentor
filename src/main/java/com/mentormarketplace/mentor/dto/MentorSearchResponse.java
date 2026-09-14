package com.mentormarketplace.mentor.dto;

import java.util.List;

public record MentorSearchResponse(
        List<MentorSearchItem> data,
        long total,
        int page,
        int pageSize
) {
}

