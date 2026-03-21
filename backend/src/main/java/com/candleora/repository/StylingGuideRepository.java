package com.candleora.repository;

import com.candleora.entity.StylingGuide;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StylingGuideRepository extends JpaRepository<StylingGuide, Long> {

    List<StylingGuide> findAllByOrderByIdAsc();

    Optional<StylingGuide> findBySlug(String slug);
}
