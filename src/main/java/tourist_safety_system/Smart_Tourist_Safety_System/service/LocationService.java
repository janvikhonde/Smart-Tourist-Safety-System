package tourist_safety_system.Smart_Tourist_Safety_System.service;

import tourist_safety_system.Smart_Tourist_Safety_System.dto.LiveTouristDTO;
import tourist_safety_system.Smart_Tourist_Safety_System.dto.LocationUpdateDTO;

import tourist_safety_system.Smart_Tourist_Safety_System.model.Location;
import tourist_safety_system.Smart_Tourist_Safety_System.model.User;

import tourist_safety_system.Smart_Tourist_Safety_System.repository.LocationRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LocationService {

    private final LocationRepository locationRepository;
    private final UserService userService;
    private final GeoFenceService geoFenceService;
    private final WebSocketService webSocketService;

    @Transactional
    public Location updateLocation(Long userId, LocationUpdateDTO dto) {

        User user = userService.getById(userId);

        // Clear previous latest flag
        locationRepository.clearLatestForUser(user);

        // Create new location record
        Location location = Location.builder()
                .user(user)
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .altitude(dto.getAltitude())
                .accuracy(dto.getAccuracy())
                .speed(dto.getSpeed())
                .bearing(dto.getBearing())
                .timestamp(dto.getTimestamp() != null
                        ? dto.getTimestamp()
                        : LocalDateTime.now())
                .isLatest(true)
                .build();

        location = locationRepository.save(location);

        // Update user status to ONLINE
        userService.updateStatus(userId, User.UserStatus.ONLINE);

        // Check geofence violations
        geoFenceService.checkViolations(user, location);

        // Broadcast location update
        webSocketService.broadcastLocationUpdate(
                buildLiveTouristDTO(user, location)
        );

        return location;
    }

    public Location getLatestLocation(Long userId) {

        User user = userService.getById(userId);

        return locationRepository.findByUserAndIsLatestTrue(user)
                .orElseThrow(() ->
                        new RuntimeException(
                                "No location data for user: " + userId
                        )
                );
    }

    public List<Location> getLocationHistory(Long userId,
                                             LocalDateTime start,
                                             LocalDateTime end) {

        User user = userService.getById(userId);

        return locationRepository
                .findByUserAndTimeRange(user, start, end);
    }

    public List<LiveTouristDTO> getAllLiveLocations() {

        return locationRepository.findAllLatestLocations()
                .stream()
                .map(loc ->
                        buildLiveTouristDTO(loc.getUser(), loc)
                )
                .collect(Collectors.toList());
    }

    private LiveTouristDTO buildLiveTouristDTO(User user,
                                               Location location) {

        return LiveTouristDTO.builder()
                .userId(user.getId())
                .fullName(user.getFullName())
                .touristId(user.getTouristId())
                .groupName(user.getGroupName())
                .nationality(user.getNationality())
                .status(user.getStatus())
                .latitude(location.getLatitude())
                .longitude(location.getLongitude())
                .lastSeen(location.getTimestamp())
                .build();
    }
}