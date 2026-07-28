package tourist_safety_system.Smart_Tourist_Safety_System.service;

import tourist_safety_system.Smart_Tourist_Safety_System.model.DangerZone;
import tourist_safety_system.Smart_Tourist_Safety_System.model.GeoFenceViolation;
import tourist_safety_system.Smart_Tourist_Safety_System.model.Location;
import tourist_safety_system.Smart_Tourist_Safety_System.model.User;

import tourist_safety_system.Smart_Tourist_Safety_System.repository.DangerZoneRepository;
import tourist_safety_system.Smart_Tourist_Safety_System.repository.GeoFenceViolationRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeoFenceService {

    private final DangerZoneRepository dangerZoneRepository;
    private final GeoFenceViolationRepository violationRepository;
    private final AlertService alertService;

    private static final double EARTH_RADIUS_METERS = 6_371_000.0;
    private static final long DUPLICATE_ALERT_COOLDOWN_MINUTES = 10;

    @Transactional
    public void checkViolations(User user, Location location) {

        List<DangerZone> activeDangerZones =
                dangerZoneRepository.findAllActiveZones();

        for (DangerZone zone : activeDangerZones) {

            double distance = haversineDistance(
                    location.getLatitude(),
                    location.getLongitude(),
                    zone.getCenterLat(),
                    zone.getCenterLng()
            );

            if (distance <= zone.getRadius()) {
                handleViolation(user, zone, location, distance);
            }
        }
    }

    private void handleViolation(User user,
                                 DangerZone zone,
                                 Location location,
                                 double distanceFromCenter) {

        double distanceFromBoundary =
                zone.getRadius() - distanceFromCenter;

        Optional<GeoFenceViolation> recent =
                violationRepository
                        .findTopByUserAndDangerZoneOrderByViolatedAtDesc(
                                user, zone
                        );

        boolean shouldAlert = recent.isEmpty() ||
                recent.get().getViolatedAt().isBefore(
                        LocalDateTime.now()
                                .minusMinutes(DUPLICATE_ALERT_COOLDOWN_MINUTES)
                );

        GeoFenceViolation violation = GeoFenceViolation.builder()
                .user(user)
                .dangerZone(zone)
                .latitude(location.getLatitude())
                .longitude(location.getLongitude())
                .distanceFromBoundary(distanceFromBoundary)
                .alertSent(shouldAlert)
                .build();

        violationRepository.save(violation);

        if (shouldAlert) {
            alertService.createGeofenceAlert(user, zone, location);

            log.warn(
                    "GEOFENCE BREACH: User {} entered danger zone {} ({}m inside boundary)",
                    user.getFullName(),
                    zone.getName(),
                    String.format("%.1f", distanceFromBoundary)
            );
        }
    }

    /**
     * Haversine formula — calculates distance in meters
     */
    public static double haversineDistance(double lat1,
                                           double lon1,
                                           double lat2,
                                           double lon2) {

        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2)
                        + Math.cos(Math.toRadians(lat1))
                        * Math.cos(Math.toRadians(lat2))
                        * Math.sin(dLon / 2)
                        * Math.sin(dLon / 2);

        return EARTH_RADIUS_METERS
                * 2
                * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    public List<DangerZone> getAllActiveDangerZones() {
        return dangerZoneRepository.findByIsActiveTrue();
    }

    @Transactional
    public DangerZone createDangerZone(DangerZone zone) {
        return dangerZoneRepository.save(zone);
    }

    @Transactional
    public void deleteDangerZone(Long id) {
        dangerZoneRepository.deleteById(id);
    }

    @Scheduled(fixedDelayString = "${app.geofence.check-interval:10000}")
    public void detectSignalLoss() {
        log.debug("Running signal loss detection...");
    }
}