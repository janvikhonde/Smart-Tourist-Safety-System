package tourist_safety_system.Smart_Tourist_Safety_System.service;

import tourist_safety_system.Smart_Tourist_Safety_System.dto.AlertDTO;
import tourist_safety_system.Smart_Tourist_Safety_System.dto.LiveTouristDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Broadcast a tourist's updated location to all connected dashboard clients.
     */
    public void broadcastLocationUpdate(LiveTouristDTO locationData) {
        messagingTemplate.convertAndSend("/topic/locations", locationData);
        log.debug("Broadcast location update for tourist: {}", locationData.getTouristId());
    }

    /**
     * Broadcast an alert to all connected dashboard clients.
     */
    public void broadcastAlert(AlertDTO alert) {
        messagingTemplate.convertAndSend("/topic/alerts", alert);
        log.info("Broadcast alert: {} [{}]", alert.getTitle(), alert.getSeverity());
    }

    /**
     * Send a private message to a specific user.
     */
    public void sendToUser(String username, String destination, Object payload) {
        messagingTemplate.convertAndSendToUser(username, destination, payload);
    }
}