package tourist_safety_system.Smart_Tourist_Safety_System.controller;
import tourist_safety_system.Smart_Tourist_Safety_System.model.DangerZone;
import tourist_safety_system.Smart_Tourist_Safety_System.service.GeoFenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

        import java.util.List;

@RestController
@RequestMapping("/api/danger-zones")
@RequiredArgsConstructor
public class DangerZoneController {

    private final GeoFenceService geoFenceService;

    @GetMapping
    public ResponseEntity<List<DangerZone>> getAllDangerZones() {
        return ResponseEntity.ok(geoFenceService.getAllActiveDangerZones());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DangerZone> createDangerZone(
            @RequestBody DangerZone zone,
            Authentication auth) {
        zone.setCreatedBy(auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(geoFenceService.createDangerZone(zone));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteDangerZone(@PathVariable Long id) {
        geoFenceService.deleteDangerZone(id);
        return ResponseEntity.noContent().build();
    }
}