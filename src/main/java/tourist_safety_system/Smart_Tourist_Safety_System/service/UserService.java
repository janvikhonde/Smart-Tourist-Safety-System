package tourist_safety_system.Smart_Tourist_Safety_System.service;

import tourist_safety_system.Smart_Tourist_Safety_System.exception.CustomExceptions.ResourceNotFoundException;
import tourist_safety_system.Smart_Tourist_Safety_System.model.User;
import tourist_safety_system.Smart_Tourist_Safety_System.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;

    // ==============================
    // GET USER BY ID
    // ==============================
    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found with id: " + id));
    }

    // ==============================
    // GET USER BY EMAIL (FIXED)
    // ==============================
    public User getByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found with email: " + email));
    }

    // ==============================
    // GET ALL TOURISTS
    // ==============================
    public List<User> getAllTourists() {
        return userRepository.findByRole(User.Role.TOURIST);
    }

    // ==============================
    // GET ONLINE TOURISTS
    // ==============================
    public List<User> getOnlineTourists() {
        return userRepository.findByStatus(User.UserStatus.ONLINE);
    }

    // ==============================
    // COUNT ACTIVE TOURISTS
    // ==============================
    public long countActiveTourists() {
        return userRepository.countActiveTourists();
    }

    // ==============================
    // UPDATE USER STATUS
    // ==============================
    @Transactional
    public void updateStatus(Long userId, User.UserStatus status) {

        User user = getById(userId);

        user.setStatus(status);
        user.setLastSeen(LocalDateTime.now());

        userRepository.save(user);
    }

    // ==============================
    // UPDATE USER DETAILS
    // ==============================
    @Transactional
    public User updateUser(Long userId, User updates) {

        if (updates == null) {
            throw new IllegalArgumentException("Update data cannot be null");
        }

        User user = getById(userId);

        if (updates.getFullName() != null)
            user.setFullName(updates.getFullName());

        if (updates.getNationality() != null)
            user.setNationality(updates.getNationality());

        if (updates.getGroupName() != null)
            user.setGroupName(updates.getGroupName());

        if (updates.getCheckIn() != null)
            user.setCheckIn(updates.getCheckIn());

        if (updates.getCheckOut() != null)
            user.setCheckOut(updates.getCheckOut());

        return userRepository.save(user);
    }

    // ==============================
    // DELETE USER
    // ==============================
    @Transactional
    public void deleteUser(Long userId) {
        User user = getById(userId);
        userRepository.delete(user);
    }
}