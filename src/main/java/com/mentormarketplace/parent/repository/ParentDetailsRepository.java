package com.mentormarketplace.parent.repository;

import com.mentormarketplace.common.model.KycStatus;
import com.mentormarketplace.parent.model.ParentDetails;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ParentDetailsRepository extends JpaRepository<ParentDetails, UUID> {
    Optional<ParentDetails> findTopByUserIdOrderByCreatedAtDesc(UUID userId);

    List<ParentDetails> findByKycStatusOrderByCreatedAtAsc(KycStatus kycStatus);
}
