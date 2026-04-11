package com.candleora.repository;

import com.candleora.entity.HomepageTestimonial;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HomepageTestimonialRepository extends JpaRepository<HomepageTestimonial, Long> {

    List<HomepageTestimonial> findAllByOrderByOrderIndexAscIdAsc();

    List<HomepageTestimonial> findAllByActiveTrueOrderByOrderIndexAscIdAsc();
}
