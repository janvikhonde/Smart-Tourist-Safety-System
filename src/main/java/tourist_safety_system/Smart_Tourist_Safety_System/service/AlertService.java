package tourist_safety_system.Smart_Tourist_Safety_System.service;

import tourist_safety_system.Smart_Tourist_Safety_System.dto.AlertDTO;
import tourist_safety_system.Smart_Tourist_Safety_System.exception.CustomExceptions.ResourceNotFoundException;
import tourist_safety_system.Smart_Tourist_Safety_System.model.Alert;
import tourist_safety_system.Smart_Tourist_Safety_System.model.DangerZone;
import tourist_safety_system.Smart_Tourist_Safety_System.model.Location;
import tourist_safety_system.Smart_Tourist_Safety_System.model.User;
import tourist_safety_system.Smart_Tourist_Safety_System.repository.AlertRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlertService {

    private final AlertRepository alertRepository;
    private final WebSocketService webSocketService;

    @Transactional
    public Alert createPanicAlert(User user, Location location) {
        Alert alert = Alert.builder()
                .user(user)
                .type(Alert.AlertType.PANIC_BUTTON)
                .severity(Alert.Severity.CRITICAL)
                .title("🆘 Panic Button — " + user.getFullName())
                .description("Tourist activated emergency SOS signal")
                .latitude(location != null ? location.getLatitude() : null)
                .longitude(location != null ? location.getLongitude() : null)
                .build();

        alert = alertRepository.save(alert);

        log.error("PANIC ALERT triggered by user: {} ({})",
                user.getFullName(), user.getTouristId());

        webSocketService.broadcastAlert(AlertDTO.from(alert));

        return alert;
    }

    @Transactional
    public Alert createGeofenceAlert(User user, DangerZone zone, Location location) {

        Alert.Severity severity = switch (zone.getRiskLevel()) {
            case CRITICAL -> Alert.Severity.CRITICAL;
            case HIGH -> Alert.Severity.HIGH;
            case MEDIUM -> Alert.Severity.MEDIUM;
            default -> Alert.Severity.INFO;
        };

        Alert alert = Alert.builder()
                .user(user)
                .type(Alert.AlertType.GEOFENCE_BREACH)
                .severity(severity)
                .title("🚨 Zone Breach — " + user.getFullName())
                .description(user.getFullName() +
                        " entered restricted area: " + zone.getName())
                .latitude(location.getLatitude())
                .longitude(location.getLongitude())
                .dangerZone(zone)
                .build();

        alert = alertRepository.save(alert);

        webSocketService.broadcastAlert(AlertDTO.from(alert));

        return alert;
    }

    public List<AlertDTO> getActiveAlerts() {
        return alertRepository.findActiveAlertsSorted()
                .stream()
                .map(AlertDTO::from)
                .collect(Collectors.toList());
    }

    public List<AlertDTO> getRecentAlerts(int limit) {
        return alertRepository
                .findAllByOrderByTriggeredAtDesc(PageRequest.of(0, limit))
                .stream()
                .map(AlertDTO::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public AlertDTO resolveAlert(Long alertId, String resolvedBy) {

        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Alert not found: " + alertId
                        )
                );

        alert.setStatus(Alert.AlertStatus.RESOLVED);
        alert.setResolvedAt(LocalDateTime.now());
        alert.setResolvedBy(resolvedBy);

        return AlertDTO.from(alertRepository.save(alert));
    }

    public long countActiveAlerts() {
        return alertRepository.countActiveAlerts();
    }

    public long countCriticalAlerts() {
        return alertRepository.countCriticalAlerts();
    }
}