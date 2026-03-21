package com.candleora.repository;

import com.candleora.entity.AppUser;
import com.candleora.entity.CustomerOrder;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long> {

    List<CustomerOrder> findByUserOrderByCreatedAtDesc(AppUser user);
}
