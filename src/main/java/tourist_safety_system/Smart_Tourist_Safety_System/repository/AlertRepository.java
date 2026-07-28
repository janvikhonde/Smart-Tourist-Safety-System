package tourist_safety_system.Smart_Tourist_Safety_System.repository;

import tourist_safety_system.Smart_Tourist_Safety_System.model.Alert;
import tourist_safety_system.Smart_Tourist_Safety_System.model.User;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {

    List<Alert> findByStatusOrderByTriggeredAtDesc(Alert.AlertStatus status);

    List<Alert> findByUserOrderByTriggeredAtDesc(User user);

    Page<Alert> findAllByOrderByTriggeredAtDesc(Pageable pageable);

    @Query("SELECT COUNT(a) FROM Alert a WHERE a.status = 'ACTIVE'")
    long countActiveAlerts();

    @Query("SELECT COUNT(a) FROM Alert a WHERE a.status = 'ACTIVE' AND a.severity = 'CRITICAL'")
    long countCriticalAlerts();

    List<Alert> findByStatusAndSeverity(Alert.AlertStatus status, Alert.Severity severity);

    @Query("SELECT a FROM Alert a WHERE a.status = 'ACTIVE' ORDER BY a.severity DESC, a.triggeredAt DESC")
    List<Alert> findActiveAlertsSorted();
}