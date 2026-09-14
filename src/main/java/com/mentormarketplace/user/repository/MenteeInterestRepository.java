package com.mentormarketplace.user.repository;

import com.mentormarketplace.user.model.MenteeInterest;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

public interface MenteeInterestRepository extends JpaRepository<MenteeInterest, UUID> {

    List<MenteeInterest> findByUser_IdOrderByCreatedAtAsc(UUID userId);

    @Transactional
    void deleteByUser_Id(UUID userId);
}
