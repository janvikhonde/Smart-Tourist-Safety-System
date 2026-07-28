package tourist_safety_system.Smart_Tourist_Safety_System.controller;

import tourist_safety_system.Smart_Tourist_Safety_System.model.User;
import tourist_safety_system.Smart_Tourist_Safety_System.service.UserService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // ================= CURRENT USER =================
    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(Authentication authentication) {

        // auth.getName() now returns EMAIL
        return ResponseEntity.ok(
                userService.getByEmail(authentication.getName())
        );
    }

    // ================= GET ALL TOURISTS (ADMIN ONLY) =================
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getAllTourists() {
        return ResponseEntity.ok(userService.getAllTourists());
    }

    // ================= GET USER BY ID =================
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('GUIDE')")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getById(id));
    }

    // ================= UPDATE USER =================
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> updateUser(
            @PathVariable Long id,
            @RequestBody User updates) {

        return ResponseEntity.ok(userService.updateUser(id, updates));
    }

    // ================= DELETE USER =================
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    // ================= ONLINE USERS =================
    @GetMapping("/online")
    @PreAuthorize("hasAnyRole('ADMIN', 'GUIDE')")
    public ResponseEntity<List<User>> getOnlineUsers() {
        return ResponseEntity.ok(userService.getOnlineTourists());
    }
}