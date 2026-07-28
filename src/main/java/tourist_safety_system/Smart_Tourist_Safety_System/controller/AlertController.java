package tourist_safety_system.Smart_Tourist_Safety_System.controller;

import tourist_safety_system.Smart_Tourist_Safety_System.dto.AlertDTO;
import tourist_safety_system.Smart_Tourist_Safety_System.model.Location;
import tourist_safety_system.Smart_Tourist_Safety_System.model.User;
import tourist_safety_system.Smart_Tourist_Safety_System.service.AlertService;
import tourist_safety_system.Smart_Tourist_Safety_System.service.LocationService;
import tourist_safety_system.Smart_Tourist_Safety_System.service.UserService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;
    private final UserService userService;
    private final LocationService locationService;

    // ================= PANIC BUTTON =================
    @PostMapping("/panic")
    public ResponseEntity<AlertDTO> triggerPanic(Authentication authentication) {

        // auth.getName() now returns EMAIL
        User user = userService.getByEmail(authentication.getName());

        Location location = null;
        try {
            location = locationService.getLatestLocation(user.getId());
        } catch (Exception ignored) {}

        return ResponseEntity.ok(
                AlertDTO.from(alertService.createPanicAlert(user, location))
        );
    }

    // ================= GET ACTIVE ALERTS =================
    @GetMapping
    public ResponseEntity<List<AlertDTO>> getActiveAlerts() {
        return ResponseEntity.ok(alertService.getActiveAlerts());
    }

    // ================= GET RECENT ALERTS =================
    @GetMapping("/recent")
    public ResponseEntity<List<AlertDTO>> getRecentAlerts(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(alertService.getRecentAlerts(limit));
    }

    // ================= RESOLVE ALERT =================
    @PatchMapping("/{id}/resolve")
    public ResponseEntity<AlertDTO> resolveAlert(
            @PathVariable Long id,
            Authentication authentication) {

        // pass email to service
        return ResponseEntity.ok(
                alertService.resolveAlert(id, authentication.getName())
        );
    }

    // ================= ALERT STATS =================
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getAlertStats() {
        return ResponseEntity.ok(
                Map.of(
                        "active", alertService.countActiveAlerts(),
                        "critical", alertService.countCriticalAlerts()
                )
        );
    }
}