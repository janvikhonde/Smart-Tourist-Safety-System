package tourist_safety_system.Smart_Tourist_Safety_System.config;
import org.springframework.context.annotation.Configuration;

/**
 * JWT configuration properties are injected directly via @Value in JwtTokenProvider.
 * This class exists as a placeholder for any future JWT-specific beans.
 */
@Configuration
public class JwtConfig {
    // JWT secret and expiration are in application.properties:
    // app.jwt.secret=...
    // app.jwt.expiration=86400000
}