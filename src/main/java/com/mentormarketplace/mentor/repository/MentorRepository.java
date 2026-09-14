package com.mentormarketplace.mentor.repository;

import com.mentormarketplace.mentor.model.Mentor;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MentorRepository extends JpaRepository<Mentor, UUID> {

    Optional<Mentor> findByUserId(UUID userId);

    @Query("""
            select distinct m
            from Mentor m
            left join fetch m.expertise
            where m.user.id = :userId
            """)
    Optional<Mentor> findByUserIdWithExpertise(@Param("userId") UUID userId);

    @Query("""
            select distinct m
            from Mentor m
            join fetch m.expertise e
            where e.category = :category
              and e.subcategory = :subcategory
            """)
    java.util.List<Mentor> findByExpertiseCategoryAndSubcategory(
            @Param("category") String category,
            @Param("subcategory") String subcategory
    );
}
