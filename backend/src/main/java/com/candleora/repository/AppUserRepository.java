package com.candleora.repository;

import com.candleora.entity.AppUser;
import com.candleora.entity.Role;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface AppUserRepository extends JpaRepository<AppUser, Long>, JpaSpecificationExecutor<AppUser> {

    long countByRole(Role role);

    Optional<AppUser> findByEmailIgnoreCase(String email);

    Optional<AppUser> findByGoogleSubject(String googleSubject);

    Optional<AppUser> findByFirebaseUid(String firebaseUid);

    Optional<AppUser> findByPhoneNumber(String phoneNumber);

    Optional<AppUser> findByEmailVerificationToken(String emailVerificationToken);

    Optional<AppUser> findByPasswordResetToken(String passwordResetToken);
}
