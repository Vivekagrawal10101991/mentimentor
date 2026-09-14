package com.mentormarketplace.request.repository;

import com.mentormarketplace.request.model.LearningRequest;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LearningRequestRepository extends JpaRepository<LearningRequest, UUID> {

    List<LearningRequest> findByMentee_IdOrderByCreatedAtDesc(UUID menteeId);

    List<LearningRequest> findByStatusOrderByCreatedAtDesc(String status);
}
