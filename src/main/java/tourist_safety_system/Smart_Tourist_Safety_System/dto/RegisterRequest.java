package tourist_safety_system.Smart_Tourist_Safety_System.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.time.LocalDate;

@Data
public class RegisterRequest {

    // username is optional — AuthService sets it from fullName if not provided
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 100, message = "Password must be at least 6 characters")
    private String password;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Full name is required")
    private String fullName;

    private String nationality;

    private String groupName;

    // "TOURIST", "ADMIN", "POLICE" — defaults to TOURIST if not provided
    private String role;

    private LocalDate checkIn;

    private LocalDate checkOut;
}