package com.candleora.repository;

import com.candleora.entity.AuraTrainingItem;
import com.candleora.entity.AuraTrainingStatus;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuraTrainingItemRepository extends JpaRepository<AuraTrainingItem, Long> {

    Optional<AuraTrainingItem> findFirstByNormalizedQuestionAndStatusOrderByUpdatedAtDesc(
        String normalizedQuestion,
        AuraTrainingStatus status
    );

    Page<AuraTrainingItem> findByStatusOrderByUpdatedAtDesc(AuraTrainingStatus status, Pageable pageable);

    Page<AuraTrainingItem> findAllByOrderByUpdatedAtDesc(Pageable pageable);

    Page<AuraTrainingItem> findTop100ByStatusOrderByUpdatedAtDesc(AuraTrainingStatus status, Pageable pageable);

    long countByStatus(AuraTrainingStatus status);
}
