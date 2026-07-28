package tourist_safety_system.Smart_Tourist_Safety_System.dto;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class LocationUpdateDTO {

    @NotNull(message = "Latitude is required")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    private Double longitude;

    private Double altitude;
    private Double accuracy;
    private Double speed;
    private Double bearing;
    private LocalDateTime timestamp;
}