package tourist_safety_system.Smart_Tourist_Safety_System.controller;
import tourist_safety_system.Smart_Tourist_Safety_System.dto.DashboardStatsDTO;
import tourist_safety_system.Smart_Tourist_Safety_System.repository.DangerZoneRepository;
import tourist_safety_system.Smart_Tourist_Safety_System.service.AlertService;
import tourist_safety_system.Smart_Tourist_Safety_System.service.LocationService;
import tourist_safety_system.Smart_Tourist_Safety_System.service.UserService;
import tourist_safety_system.Smart_Tourist_Safety_System.model.DangerZone;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final UserService userService;
    private final AlertService alertService;
    private final DangerZoneRepository dangerZoneRepo;
    private final LocationService locationService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDTO> getDashboardStats() {
        DashboardStatsDTO stats = DashboardStatsDTO.builder()
                .activeTourists(userService.countActiveTourists())
                .activeAlerts(alertService.countActiveAlerts())
                .criticalAlerts(alertService.countCriticalAlerts())
                .dangerZones(dangerZoneRepo.countActiveDangerZones())
                .highRiskZones(dangerZoneRepo.countByRiskLevel(DangerZone.RiskLevel.HIGH)
                        + dangerZoneRepo.countByRiskLevel(DangerZone.RiskLevel.CRITICAL))
                .avgResponseTimeMinutes(4.2) // TODO: compute from resolved alerts
                .recentAlerts(alertService.getRecentAlerts(5))
                .liveTourists(locationService.getAllLiveLocations())
                .build();
        return ResponseEntity.ok(stats);
    }
}