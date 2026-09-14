package com.mentormarketplace.user.repository;

import com.mentormarketplace.common.model.KycStatus;
import com.mentormarketplace.user.model.User;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByCountryCodeAndPhoneNumber(String countryCode, String phoneNumber);

    Optional<User> findByGoogleSub(String googleSub);

    Optional<User> findByEmailIgnoreCase(String email);

    List<User> findBySelfKycStatusOrderByCreatedAtAsc(KycStatus selfKycStatus);
}

