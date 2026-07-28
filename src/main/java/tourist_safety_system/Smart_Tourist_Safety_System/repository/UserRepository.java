package tourist_safety_system.Smart_Tourist_Safety_System.repository;

import tourist_safety_system.Smart_Tourist_Safety_System.model.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // ==============================
    // AUTHENTICATION
    // ==============================
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    // ==============================
    // OTHER UNIQUE FIELDS
    // ==============================
    Optional<User> findByTouristId(String touristId);

    // ==============================
    // FILTERS
    // ==============================
    List<User> findByStatus(User.UserStatus status);

    List<User> findByRole(User.Role role);

    List<User> findByGroupName(String groupName);

    // ==============================
    // CUSTOM QUERIES
    // ==============================
    @Query("SELECT COUNT(u) FROM User u WHERE u.status = 'ONLINE' AND u.role = 'TOURIST'")
    long countActiveTourists();

    @Query("SELECT u FROM User u WHERE u.role = 'TOURIST' ORDER BY u.lastSeen DESC")
    List<User> findAllTouristsOrderedByLastSeen();
}