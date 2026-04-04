package com.candleora.repository;

import com.candleora.entity.AppUser;
import com.candleora.entity.ReplacementRequest;
import com.candleora.entity.ReplacementStatus;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReplacementRepository
    extends JpaRepository<ReplacementRequest, Long>, JpaSpecificationExecutor<ReplacementRequest> {

    Optional<ReplacementRequest> findByIdAndOrderUser(Long id, AppUser user);

    Optional<ReplacementRequest> findTopByOrderIdAndOrderItemIdOrderByRequestedAtDesc(Long orderId, Long orderItemId);

    Optional<ReplacementRequest> findTopByOrderIdOrderByRequestedAtDesc(Long orderId);

    boolean existsByOrderIdAndOrderItemId(Long orderId, Long orderItemId);

    boolean existsByOrderIdAndOrderItemIdAndStatusIn(
        Long orderId,
        Long orderItemId,
        Collection<ReplacementStatus> statuses
    );

    List<ReplacementRequest> findByOrderIdOrderByRequestedAtDesc(Long orderId);

    List<ReplacementRequest> findByOrderIdInOrderByRequestedAtDesc(Collection<Long> orderIds);

    List<ReplacementRequest> findByOrderUserAndRequestedAtAfter(AppUser user, Instant requestedAfter);

    List<ReplacementRequest> findByAdminReviewedAtIsNullOrderByRequestedAtDesc(Pageable pageable);

    long countByAdminReviewedAtIsNull();

    @Modifying
    @Query("update ReplacementRequest r set r.adminReviewedAt = :reviewedAt where r.adminReviewedAt is null")
    int markAllUnreadReviewed(@Param("reviewedAt") Instant reviewedAt);
}
