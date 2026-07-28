package tourist_safety_system.Smart_Tourist_Safety_System.model;
import jakarta.persistence.*;
        import lombok.*;
        import java.time.LocalDateTime;

@Entity
@Table(name = "geofence_violations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GeoFenceViolation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "danger_zone_id", nullable = false)
    private DangerZone dangerZone;

    private Double latitude;
    private Double longitude;

    @Column(name = "distance_from_boundary")
    private Double distanceFromBoundary; // meters inside zone

    @Column(name = "violated_at")
    @Builder.Default
    private LocalDateTime violatedAt = LocalDateTime.now();

    @Column(name = "alert_sent")
    @Builder.Default
    private Boolean alertSent = false;
}