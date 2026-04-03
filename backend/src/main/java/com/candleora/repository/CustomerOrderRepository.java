package com.candleora.repository;

import com.candleora.entity.AppUser;
import com.candleora.entity.CustomerOrder;
import com.candleora.entity.OrderStatus;
import com.candleora.entity.PaymentStatus;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long>, JpaSpecificationExecutor<CustomerOrder> {

    List<CustomerOrder> findByUserOrderByCreatedAtDesc(AppUser user);

    List<CustomerOrder> findByUserIn(List<AppUser> users);

    Optional<CustomerOrder> findByIdAndUser(Long id, AppUser user);

    Optional<CustomerOrder> findByIdAndContactEmailIgnoreCase(Long id, String contactEmail);

    Optional<CustomerOrder> findByGatewayOrderId(String gatewayOrderId);

    List<CustomerOrder> findByTrackingNumberIsNotNullAndStatusIn(Collection<OrderStatus> statuses);

    List<CustomerOrder> findByAdminReviewedAtIsNullOrderByCreatedAtDesc(Pageable pageable);

    long countByAdminReviewedAtIsNull();

    @Modifying
    @Query("update CustomerOrder o set o.adminReviewedAt = :reviewedAt where o.adminReviewedAt is null")
    int markAllUnreadReviewed(@Param("reviewedAt") Instant reviewedAt);

    long countByUserAndStatusNotAndPaymentStatusNot(
        AppUser user,
        OrderStatus excludedStatus,
        PaymentStatus excludedPaymentStatus
    );

    boolean existsByUserAndCouponCodeIgnoreCaseAndStatusNotAndPaymentStatusNot(
        AppUser user,
        String couponCode,
        OrderStatus excludedStatus,
        PaymentStatus excludedPaymentStatus
    );
}
