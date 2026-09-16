package com.mentormarketplace.mentor.availability.repository;

import com.mentormarketplace.mentor.availability.model.MentorAvailabilitySnapshot;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

public interface MentorAvailabilitySnapshotRepository extends JpaRepository<MentorAvailabilitySnapshot, UUID> {

    Optional<MentorAvailabilitySnapshot> findByMentorId(UUID mentorId);

    List<MentorAvailabilitySnapshot> findAllByAvailableTrue();

    @Transactional
    void deleteByMentorId(UUID mentorId);
}
