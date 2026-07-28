package tourist_safety_system.Smart_Tourist_Safety_System.dto;
import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class DashboardStatsDTO {
    private long activeTourists;
    private long activeAlerts;
    private long criticalAlerts;
    private long dangerZones;
    private long highRiskZones;
    private double avgResponseTimeMinutes;
    private List<AlertDTO> recentAlerts;
    private List<LiveTouristDTO> liveTourists;
}