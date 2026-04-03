package com.candleora.repository;

import com.candleora.entity.ContactMessage;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ContactMessageRepository
    extends JpaRepository<ContactMessage, Long>, JpaSpecificationExecutor<ContactMessage> {

    List<ContactMessage> findByAdminReviewedAtIsNullOrderByCreatedAtDesc(Pageable pageable);

    long countByAdminReviewedAtIsNull();

    @Modifying
    @Query("update ContactMessage c set c.adminReviewedAt = :reviewedAt where c.adminReviewedAt is null")
    int markAllUnreadReviewed(@Param("reviewedAt") LocalDateTime reviewedAt);
}
