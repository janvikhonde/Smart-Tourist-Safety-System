package tourist_safety_system.Smart_Tourist_Safety_System.model;
import jakarta.persistence.*;
        import lombok.*;
        import java.time.LocalDateTime;

@Entity
@Table(name = "locations", indexes = {
        @Index(name = "idx_location_user", columnList = "user_id"),
        @Index(name = "idx_location_timestamp", columnList = "timestamp")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    private Double altitude;
    private Double accuracy; // in meters
    private Double speed;    // in m/s
    private Double bearing;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    // Whether this is the most recent location for the user
    @Column(name = "is_latest")
    @Builder.Default
    private Boolean isLatest = true;
}