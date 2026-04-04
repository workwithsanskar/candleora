package com.candleora.repository;

import com.candleora.entity.AnnouncementMessage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnnouncementMessageRepository extends JpaRepository<AnnouncementMessage, Long> {

    List<AnnouncementMessage> findAllByOrderByOrderIndexAscIdAsc();

    List<AnnouncementMessage> findAllByActiveTrueOrderByOrderIndexAscIdAsc();
}
