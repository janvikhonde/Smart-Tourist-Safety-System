package tourist_safety_system.Smart_Tourist_Safety_System.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

public class AuthDTOs {

    // ================= LOGIN =================
    @Data
    public static class LoginRequest {

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Password is required")
        private String password;
    }

    // ================= REGISTER =================
    @Data
    public static class RegisterRequest {

        // NOT @NotBlank — username is auto-generated from fullName if missing
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

        // Accepts: TOURIST, ADMIN, GUIDE, POLICE
        private String role;
    }

    // ================= RESPONSE =================
    @Data
    public static class AuthResponse {

        private String token;
        private String tokenType = "Bearer";
        private Long userId;
        private String email;
        private String role;
        private String touristId;
        private Long expiresIn;

        public AuthResponse(String token,
                            Long userId,
                            String email,
                            String role,
                            String touristId,
                            Long expiresIn) {
            this.token     = token;
            this.userId    = userId;
            this.email     = email;
            this.role      = role;
            this.touristId = touristId;
            this.expiresIn = expiresIn;
        }
    }
}