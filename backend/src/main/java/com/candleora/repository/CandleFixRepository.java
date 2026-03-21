package com.candleora.repository;

import com.candleora.entity.CandleFix;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CandleFixRepository extends JpaRepository<CandleFix, Long> {

    List<CandleFix> findAllByOrderByIdAsc();
}
