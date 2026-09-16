package com.mentormarketplace.parent.repository;

import com.mentormarketplace.parent.model.ParentDetails;
import com.mentormarketplace.common.model.KycStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

public interface ParentDetailsRepository extends JpaRepository<ParentDetails, UUID> {
    Optional<ParentDetails> findTopByUserIdOrderByCreatedAtDesc(UUID userId);

    List<ParentDetails> findByKycStatusOrderByCreatedAtAsc(KycStatus kycStatus);

    @Transactional
    void deleteByUser_Id(UUID userId);
}
