package com.mentormarketplace.payment.repository;

import com.mentormarketplace.payment.model.PaymentTransaction;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, UUID> {
}
