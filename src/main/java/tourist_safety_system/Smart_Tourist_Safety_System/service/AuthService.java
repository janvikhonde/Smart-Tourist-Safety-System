package tourist_safety_system.Smart_Tourist_Safety_System.service;

import tourist_safety_system.Smart_Tourist_Safety_System.dto.AuthDTOs.AuthResponse;
import tourist_safety_system.Smart_Tourist_Safety_System.dto.AuthDTOs.LoginRequest;
import tourist_safety_system.Smart_Tourist_Safety_System.dto.AuthDTOs.RegisterRequest;
import tourist_safety_system.Smart_Tourist_Safety_System.exception.CustomExceptions.DuplicateResourceException;
import tourist_safety_system.Smart_Tourist_Safety_System.exception.CustomExceptions.ResourceNotFoundException;
import tourist_safety_system.Smart_Tourist_Safety_System.model.User;
import tourist_safety_system.Smart_Tourist_Safety_System.repository.UserRepository;
import tourist_safety_system.Smart_Tourist_Safety_System.security.JwtTokenProvider;

import lombok.RequiredArgsConstructor;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    // ================= LOGIN =================
    public AuthResponse login(LoginRequest request) {

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        String token = tokenProvider.generateToken(authentication);

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found with email: " + request.getEmail()
                        )
                );

        return new AuthResponse(
                token,
                user.getId(),
                user.getEmail(),
                user.getRole().name(),
                user.getTouristId(),
                tokenProvider.getExpirationMs()
        );
    }

    // ================= REGISTER =================
    @Transactional
    public AuthResponse register(RegisterRequest request) {

        // Check duplicate email
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException(
                    "Email already registered: " + request.getEmail()
            );
        }

        // ── Resolve role ───────────────────────────────────────
        User.Role role = User.Role.TOURIST;
        if (request.getRole() != null && !request.getRole().isBlank()) {
            try {
                role = User.Role.valueOf(request.getRole().toUpperCase());
            } catch (IllegalArgumentException ignored) {
                role = User.Role.TOURIST;
            }
        }

        // ── Generate username if not provided ──────────────────
        String username = request.getUsername();
        if (username == null || username.isBlank()) {
            // derive from fullName e.g. "Sarah Kowalski" → "sarah_kowalski"
            String derived = request.getFullName()
                    .toLowerCase()
                    .replaceAll("\\s+", "_")
                    .replaceAll("[^a-z0-9_]", "");

            username = derived.isBlank()
                    ? request.getEmail().split("@")[0]
                    : derived.substring(0, Math.min(50, derived.length()));
        }

        // ── Generate tourist tracking ID ───────────────────────
        String touristId = "TRK-" + String.format("%05d", (int) (Math.random() * 99999));

        // ── Build and save user ────────────────────────────────
        User user = User.builder()
                .username(username)
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .nationality(request.getNationality())
                .groupName(request.getGroupName())
                .role(role)
                .touristId(touristId)
                .build();

        userRepository.save(user);

        // ── Auto-login after registration ──────────────────────
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        String token = tokenProvider.generateToken(authentication);

        return new AuthResponse(
                token,
                user.getId(),
                user.getEmail(),
                user.getRole().name(),
                user.getTouristId(),
                tokenProvider.getExpirationMs()
        );
    }
}