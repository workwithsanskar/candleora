package com.candleora.repository;

import com.candleora.entity.AppUser;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {

    Optional<AppUser> findByEmailIgnoreCase(String email);

    Optional<AppUser> findByGoogleSubject(String googleSubject);

    Optional<AppUser> findByFirebaseUid(String firebaseUid);

    Optional<AppUser> findByPhoneNumber(String phoneNumber);

    Optional<AppUser> findByEmailVerificationToken(String emailVerificationToken);
}
