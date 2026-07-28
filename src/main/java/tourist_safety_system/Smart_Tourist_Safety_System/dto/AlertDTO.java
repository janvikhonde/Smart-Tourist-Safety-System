package tourist_safety_system.Smart_Tourist_Safety_System.dto;
import tourist_safety_system.Smart_Tourist_Safety_System.model.Alert;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class AlertDTO {

    private Long id;
    private Long userId;
    private String userName;
    private String touristId;
    private Alert.AlertType type;
    private Alert.Severity severity;
    private String title;
    private String description;
    private Double latitude;
    private Double longitude;
    private Alert.AlertStatus status;
    private LocalDateTime triggeredAt;
    private LocalDateTime resolvedAt;
    private String resolvedBy;
    private Long dangerZoneId;
    private String dangerZoneName;

    public static AlertDTO from(Alert alert) {
        AlertDTO dto = new AlertDTO();
        dto.setId(alert.getId());
        if (alert.getUser() != null) {
            dto.setUserId(alert.getUser().getId());
            dto.setUserName(alert.getUser().getFullName());
            dto.setTouristId(alert.getUser().getTouristId());
        }
        dto.setType(alert.getType());
        dto.setSeverity(alert.getSeverity());
        dto.setTitle(alert.getTitle());
        dto.setDescription(alert.getDescription());
        dto.setLatitude(alert.getLatitude());
        dto.setLongitude(alert.getLongitude());
        dto.setStatus(alert.getStatus());
        dto.setTriggeredAt(alert.getTriggeredAt());
        dto.setResolvedAt(alert.getResolvedAt());
        dto.setResolvedBy(alert.getResolvedBy());
        if (alert.getDangerZone() != null) {
            dto.setDangerZoneId(alert.getDangerZone().getId());
            dto.setDangerZoneName(alert.getDangerZone().getName());
        }
        return dto;
    }
}