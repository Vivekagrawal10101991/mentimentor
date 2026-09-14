package com.mentormarketplace.admin.service.impl;

import com.mentormarketplace.admin.dto.ParentKycQueueItem;
import com.mentormarketplace.admin.dto.PendingKycResponse;
import com.mentormarketplace.admin.dto.UserSelfKycQueueItem;
import com.mentormarketplace.admin.service.AdminKycService;
import com.mentormarketplace.common.exception.BadRequestException;
import com.mentormarketplace.common.exception.ResourceNotFoundException;
import com.mentormarketplace.common.model.KycStatus;
import com.mentormarketplace.parent.model.ParentDetails;
import com.mentormarketplace.parent.repository.ParentDetailsRepository;
import com.mentormarketplace.user.model.User;
import com.mentormarketplace.user.repository.UserRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminKycServiceImpl implements AdminKycService {

    private final ParentDetailsRepository parentDetailsRepository;
    private final UserRepository userRepository;

    public AdminKycServiceImpl(
            ParentDetailsRepository parentDetailsRepository,
            UserRepository userRepository
    ) {
        this.parentDetailsRepository = parentDetailsRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public PendingKycResponse listPending() {
        List<ParentKycQueueItem> parents = parentDetailsRepository
                .findByKycStatusOrderByCreatedAtAsc(KycStatus.SUBMITTED)
                .stream()
                .map(this::toParentItem)
                .toList();
        List<UserSelfKycQueueItem> adults = userRepository
                .findBySelfKycStatusOrderByCreatedAtAsc(KycStatus.SUBMITTED)
                .stream()
                .map(this::toSelfItem)
                .toList();
        return new PendingKycResponse(parents, adults);
    }

    @Override
    @Transactional
    public void approveParentSubmission(UUID parentDetailsId) {
        ParentDetails d = parentDetailsRepository.findById(parentDetailsId)
                .orElseThrow(() -> new ResourceNotFoundException("Parent submission not found"));
        requireSubmitted(d.getKycStatus());
        d.setKycStatus(KycStatus.VERIFIED);
        parentDetailsRepository.save(d);
    }

    @Override
    @Transactional
    public void rejectParentSubmission(UUID parentDetailsId, String reason) {
        ParentDetails d = parentDetailsRepository.findById(parentDetailsId)
                .orElseThrow(() -> new ResourceNotFoundException("Parent submission not found"));
        requireSubmitted(d.getKycStatus());
        d.setKycStatus(KycStatus.REJECTED);
        parentDetailsRepository.save(d);
    }

    @Override
    @Transactional
    public void approveUserSelfKyc(UUID userId) {
        User u = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (u.getSelfKycStatus() != KycStatus.SUBMITTED) {
            throw new BadRequestException("User self KYC is not awaiting review");
        }
        u.setSelfKycStatus(KycStatus.VERIFIED);
        userRepository.save(u);
    }

    @Override
    @Transactional
    public void rejectUserSelfKyc(UUID userId, String reason) {
        User u = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (u.getSelfKycStatus() != KycStatus.SUBMITTED) {
            throw new BadRequestException("User self KYC is not awaiting review");
        }
        u.setSelfKycStatus(KycStatus.REJECTED);
        userRepository.save(u);
    }

    private static void requireSubmitted(KycStatus status) {
        if (status != KycStatus.SUBMITTED) {
            throw new BadRequestException("Submission is not awaiting review");
        }
    }

    private ParentKycQueueItem toParentItem(ParentDetails d) {
        User u = d.getUser();
        return new ParentKycQueueItem(
                d.getId(),
                u.getId(),
                u.getCountryCode(),
                u.getPhoneNumber(),
                u.getAge(),
                d.getParentName(),
                d.getParentPhone(),
                maskAadhar(d.getParentAadharNumber()),
                d.getKycStatus().name()
        );
    }

    private UserSelfKycQueueItem toSelfItem(User u) {
        return new UserSelfKycQueueItem(
                u.getId(),
                u.getCountryCode(),
                u.getPhoneNumber(),
                u.getAge(),
                u.getFirstName(),
                u.getLastName(),
                maskAadhar(u.getSelfAadharReference()),
                u.getSelfKycStatus().name()
        );
    }

    private static String maskAadhar(String raw) {
        if (raw == null || raw.isBlank()) {
            return "";
        }
        String digits = raw.replaceAll("\\D", "");
        if (digits.length() < 4) {
            return "****";
        }
        return "XXXX XXXX " + digits.substring(digits.length() - 4);
    }
}
