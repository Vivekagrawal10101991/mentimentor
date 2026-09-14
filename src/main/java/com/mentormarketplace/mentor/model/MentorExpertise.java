package com.mentormarketplace.mentor.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class MentorExpertise {

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private String subcategory;

    public MentorExpertise() {
    }

    public MentorExpertise(String category, String subcategory) {
        this.category = category;
        this.subcategory = subcategory;
    }

    public String getCategory() {
        return category;
    }

    public String getSubcategory() {
        return subcategory;
    }
}
