package com.candleora.repository;

import com.candleora.entity.AppUser;
import com.candleora.entity.CustomerOrder;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long>, JpaSpecificationExecutor<CustomerOrder> {

    List<CustomerOrder> findByUserOrderByCreatedAtDesc(AppUser user);

    List<CustomerOrder> findByUserIn(List<AppUser> users);

    Optional<CustomerOrder> findByIdAndUser(Long id, AppUser user);

    Optional<CustomerOrder> findByGatewayOrderId(String gatewayOrderId);
}
