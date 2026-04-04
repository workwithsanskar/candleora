package com.candleora.repository;

import com.candleora.entity.FestiveBanner;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FestiveBannerRepository extends JpaRepository<FestiveBanner, Long> {

    List<FestiveBanner> findAllByOrderByPriorityDescStartTimeDescIdDesc();

    List<FestiveBanner> findAllByActiveTrueOrderByPriorityDescStartTimeAscIdDesc();
}
