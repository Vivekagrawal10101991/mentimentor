package com.mentormarketplace.request.repository;

import com.mentormarketplace.request.model.LearningRequest;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

public interface LearningRequestRepository extends JpaRepository<LearningRequest, UUID> {

    List<LearningRequest> findByMentee_IdOrderByCreatedAtDesc(UUID menteeId);

    List<LearningRequest> findByStatusOrderByCreatedAtDesc(String status);

    List<LearningRequest> findByAssignedMentor_Id(UUID mentorId);

    @Transactional
    void deleteByMentee_Id(UUID menteeId);
}
