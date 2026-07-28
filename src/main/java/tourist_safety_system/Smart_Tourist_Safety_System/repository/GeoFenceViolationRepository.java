package tourist_safety_system.Smart_Tourist_Safety_System.repository;

import tourist_safety_system.Smart_Tourist_Safety_System.model.DangerZone;
import tourist_safety_system.Smart_Tourist_Safety_System.model.GeoFenceViolation;
import tourist_safety_system.Smart_Tourist_Safety_System.model.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface GeoFenceViolationRepository extends JpaRepository<GeoFenceViolation, Long> {

    List<GeoFenceViolation> findByUserOrderByViolatedAtDesc(User user);

    List<GeoFenceViolation> findByDangerZone(DangerZone dangerZone);

    // Prevent duplicate alerts
    Optional<GeoFenceViolation> findTopByUserAndDangerZoneOrderByViolatedAtDesc(
            User user,
            DangerZone zone
    );

    @Query("SELECT v FROM GeoFenceViolation v WHERE v.alertSent = false")
    List<GeoFenceViolation> findUnsentViolations();

    @Query("SELECT COUNT(v) FROM GeoFenceViolation v WHERE v.violatedAt > :since")
    long countRecentViolations(@Param("since") LocalDateTime since);
}