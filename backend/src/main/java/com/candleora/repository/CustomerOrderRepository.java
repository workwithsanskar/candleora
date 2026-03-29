package com.candleora.repository;

import com.candleora.entity.AppUser;
import com.candleora.entity.CustomerOrder;
import com.candleora.entity.OrderStatus;
import com.candleora.entity.PaymentStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long>, JpaSpecificationExecutor<CustomerOrder> {

    List<CustomerOrder> findByUserOrderByCreatedAtDesc(AppUser user);

    List<CustomerOrder> findByUserIn(List<AppUser> users);

    Optional<CustomerOrder> findByIdAndUser(Long id, AppUser user);

    Optional<CustomerOrder> findByIdAndContactEmailIgnoreCase(Long id, String contactEmail);

    Optional<CustomerOrder> findByGatewayOrderId(String gatewayOrderId);

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
