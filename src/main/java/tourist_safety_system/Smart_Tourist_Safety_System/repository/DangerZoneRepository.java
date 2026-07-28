package tourist_safety_system.Smart_Tourist_Safety_System.repository;

import tourist_safety_system.Smart_Tourist_Safety_System.model.DangerZone;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DangerZoneRepository extends JpaRepository<DangerZone, Long> {

    List<DangerZone> findByIsActiveTrue();

    List<DangerZone> findByRiskLevel(DangerZone.RiskLevel riskLevel);

    List<DangerZone> findByIsActiveTrueAndRiskLevel(DangerZone.RiskLevel riskLevel);

    @Query("SELECT COUNT(d) FROM DangerZone d WHERE d.isActive = true")
    long countActiveDangerZones();

    @Query("SELECT COUNT(d) FROM DangerZone d WHERE d.isActive = true AND d.riskLevel = :level")
    long countByRiskLevel(@Param("level") DangerZone.RiskLevel level);

    // Find all active zones - distance calculation done in service
    @Query("SELECT d FROM DangerZone d WHERE d.isActive = true")
    List<DangerZone> findAllActiveZones();
}