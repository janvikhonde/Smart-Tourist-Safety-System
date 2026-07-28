package tourist_safety_system.Smart_Tourist_Safety_System.controller;

import tourist_safety_system.Smart_Tourist_Safety_System.dto.LiveTouristDTO;
import tourist_safety_system.Smart_Tourist_Safety_System.dto.LocationUpdateDTO;
import tourist_safety_system.Smart_Tourist_Safety_System.model.Location;
import tourist_safety_system.Smart_Tourist_Safety_System.model.User;
import tourist_safety_system.Smart_Tourist_Safety_System.service.LocationService;
import tourist_safety_system.Smart_Tourist_Safety_System.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@Controller
@RequiredArgsConstructor
public class LocationController {

    private final LocationService locationService;
    private final UserService userService;

    // ================= REST LOCATION UPDATE =================
    @PostMapping("/api/location")
    @ResponseBody
    public ResponseEntity<Location> updateLocationRest(
            Authentication authentication,
            @Valid @RequestBody LocationUpdateDTO dto) {

        // auth.getName() now returns EMAIL
        User user = userService.getByEmail(authentication.getName());

        return ResponseEntity.ok(
                locationService.updateLocation(user.getId(), dto)
        );
    }

    // ================= WEBSOCKET LOCATION UPDATE =================
    @MessageMapping("/location")
    public void updateLocationWs(Authentication authentication,
                                 LocationUpdateDTO dto) {

        User user = userService.getByEmail(authentication.getName());

        locationService.updateLocation(user.getId(), dto);
    }

    // ================= ALL LIVE LOCATIONS =================
    @GetMapping("/api/location/live")
    @ResponseBody
    public ResponseEntity<List<LiveTouristDTO>> getAllLiveLocations() {
        return ResponseEntity.ok(
                locationService.getAllLiveLocations()
        );
    }

    // ================= LATEST LOCATION =================
    @GetMapping("/api/location/{userId}/latest")
    @ResponseBody
    public ResponseEntity<Location> getLatestLocation(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                locationService.getLatestLocation(userId)
        );
    }

    // ================= LOCATION HISTORY =================
    @GetMapping("/api/location/{userId}/history")
    @ResponseBody
    public ResponseEntity<List<Location>> getLocationHistory(
            @PathVariable Long userId,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime start,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime end) {

        return ResponseEntity.ok(
                locationService.getLocationHistory(userId, start, end)
        );
    }
}