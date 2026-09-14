package com.mentormarketplace.payment.controller;

import com.mentormarketplace.common.exception.BadRequestException;
import com.mentormarketplace.payment.dto.contract.CreateRefundRequest;
import com.mentormarketplace.payment.dto.contract.ListPaymentsEnvelope;
import com.mentormarketplace.payment.dto.contract.PaymentEnvelope;
import com.mentormarketplace.payment.dto.contract.RefundEnvelope;
import com.mentormarketplace.payment.service.PaymentContractService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/payments")
public class PaymentContractController {

    private final PaymentContractService paymentContractService;

    public PaymentContractController(PaymentContractService paymentContractService) {
        this.paymentContractService = paymentContractService;
    }

    @GetMapping
    public ResponseEntity<ListPaymentsEnvelope> listPayments(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize
    ) {
        if (page < 1 || pageSize < 1 || pageSize > 100) {
            throw new BadRequestException("Invalid pagination");
        }
        return ResponseEntity.ok(paymentContractService.listPayments(currentUserId(), page, pageSize));
    }

    @GetMapping("/{paymentId}")
    public ResponseEntity<PaymentEnvelope> getPayment(@PathVariable UUID paymentId) {
        return ResponseEntity.ok(paymentContractService.getPayment(paymentId, currentUserId()));
    }

    @PostMapping("/{paymentId}/refund")
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<RefundEnvelope> createRefund(
            @PathVariable UUID paymentId,
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody CreateRefundRequest request
    ) {
        if (idempotencyKey == null || idempotencyKey.length() < 8 || idempotencyKey.length() > 128) {
            throw new BadRequestException("Idempotency-Key header must be between 8 and 128 characters");
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(paymentContractService.createRefund(paymentId, currentUserId(), request, idempotencyKey));
    }

    private static UUID currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof UUID id)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return id;
    }
}
