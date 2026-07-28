package tourist_safety_system.Smart_Tourist_Safety_System.repository;

import tourist_safety_system.Smart_Tourist_Safety_System.model.Location;
import tourist_safety_system.Smart_Tourist_Safety_System.model.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface LocationRepository extends JpaRepository<Location, Long> {

    Optional<Location> findByUserAndIsLatestTrue(User user);

    List<Location> findByUserOrderByTimestampDesc(User user);

    @Query("SELECT l FROM Location l WHERE l.user = :user AND l.timestamp BETWEEN :start AND :end ORDER BY l.timestamp DESC")
    List<Location> findByUserAndTimeRange(@Param("user") User user,
                                          @Param("start") LocalDateTime start,
                                          @Param("end") LocalDateTime end);

    @Query("SELECT l FROM Location l WHERE l.isLatest = true")
    List<Location> findAllLatestLocations();

    @Modifying
    @Query("UPDATE Location l SET l.isLatest = false WHERE l.user = :user AND l.isLatest = true")
    void clearLatestForUser(@Param("user") User user);

    @Query("SELECT l FROM Location l WHERE l.isLatest = true AND l.timestamp < :threshold")
    List<Location> findStaleLocations(@Param("threshold") LocalDateTime threshold);
}