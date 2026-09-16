package com.mentormarketplace.payment.repository;

import com.mentormarketplace.payment.model.PaymentTransaction;
import java.util.Collection;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, UUID> {

    @Transactional
    void deleteByPayment_IdIn(Collection<UUID> paymentIds);
}
