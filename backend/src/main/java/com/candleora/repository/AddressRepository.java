package com.candleora.repository;

import com.candleora.entity.Address;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AddressRepository extends JpaRepository<Address, Long> {

    long countByUserId(Long userId);

    List<Address> findAllByUserIdOrderByIsDefaultDescUpdatedAtDescIdDesc(Long userId);

    Optional<Address> findByIdAndUserId(Long id, Long userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query("update Address address set address.isDefault = false where address.user.id = :userId and address.isDefault = true")
    void clearDefaultForUser(@Param("userId") Long userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query("update Address address set address.isDefault = false where address.user.id = :userId and address.id <> :addressId and address.isDefault = true")
    void clearDefaultForUserExcept(@Param("userId") Long userId, @Param("addressId") Long addressId);
}
