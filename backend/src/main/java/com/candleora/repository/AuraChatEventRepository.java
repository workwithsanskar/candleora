package com.candleora.repository;

import com.candleora.entity.AuraChatEvent;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuraChatEventRepository extends JpaRepository<AuraChatEvent, Long> {

    List<AuraChatEvent> findByCreatedAtGreaterThanEqualAndCreatedAtLessThan(Instant start, Instant end);
}
