package com.mentormarketplace.payment.repository;

import com.mentormarketplace.payment.model.Refund;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RefundRepository extends JpaRepository<Refund, UUID> {
}
