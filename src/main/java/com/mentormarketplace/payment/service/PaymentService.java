package com.mentormarketplace.payment.service;

import com.mentormarketplace.payment.dto.PaymentConfirmRequest;
import com.mentormarketplace.payment.dto.PaymentConfirmResponse;
import com.mentormarketplace.payment.dto.PaymentInitiateRequest;
import com.mentormarketplace.payment.dto.PaymentInitiateResponse;

public interface PaymentService {

    PaymentInitiateResponse initiatePayment(PaymentInitiateRequest request);

    PaymentConfirmResponse confirmPayment(PaymentConfirmRequest request);
}
