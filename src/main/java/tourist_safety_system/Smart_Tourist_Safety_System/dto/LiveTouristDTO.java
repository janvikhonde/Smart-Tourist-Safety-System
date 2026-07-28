package tourist_safety_system.Smart_Tourist_Safety_System.dto;


import tourist_safety_system.Smart_Tourist_Safety_System.model.User;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class LiveTouristDTO {
    private Long userId;
    private String fullName;
    private String touristId;
    private String groupName;
    private String nationality;
    private User.UserStatus status;
    private Double latitude;
    private Double longitude;
    private LocalDateTime lastSeen;
    private boolean hasActiveAlert;
}