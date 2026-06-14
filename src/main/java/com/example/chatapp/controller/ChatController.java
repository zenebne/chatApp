package com.example.chatapp.controller;

import com.example.chatapp.Message;
import com.example.chatapp.MessageRepository;
import com.example.chatapp.User;
import com.example.chatapp.UserDTO;
import com.example.chatapp.UserRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@RestController
@CrossOrigin
public class ChatController {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    public ChatController(MessageRepository messageRepository, UserRepository userRepository) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody User user) {
        String username = user.getUsername().trim();
        String password = user.getPassword().trim();
        if (username.isEmpty() || password.isEmpty())
            return ResponseEntity.badRequest().body("Username and password cannot be empty.");
        if (userRepository.existsByUsername(username))
            return ResponseEntity.badRequest().body("Username is already taken.");
        userRepository.save(new User(username, password));
        return ResponseEntity.ok("User registered successfully.");
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody User loginRequest) {
        String username = loginRequest.getUsername().trim();
        String password = loginRequest.getPassword().trim();
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent() && userOpt.get().getPassword().equals(password))
            return ResponseEntity.ok(username);
        return ResponseEntity.status(401).body("Invalid username or password.");
    }

    @GetMapping("/users")
    public List<UserDTO> getUsers() {
        return userRepository.findAll().stream()
                .map(user -> new UserDTO(user.getUsername(), user.getStatus(), user.getPersonalMessage()))
                .toList();
    }

    @PostMapping("/updateStatus")
    public ResponseEntity<String> updateStatus(@RequestBody UserDTO request) {
        String username = request.getUsername();
        String status = request.getStatus();
        if (username == null || username.trim().isEmpty())
            return ResponseEntity.badRequest().body("Username cannot be empty.");
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setStatus(status != null ? status : "Online");
            userRepository.save(user);
            return ResponseEntity.ok("Status updated.");
        }
        return ResponseEntity.status(404).body("User not found.");
    }

    @PostMapping("/updatePersonalMessage")
    public ResponseEntity<String> updatePersonalMessage(@RequestBody UserDTO request) {
        String username = request.getUsername();
        String msg = request.getPersonalMessage();
        if (username == null || username.trim().isEmpty())
            return ResponseEntity.badRequest().body("Username cannot be empty.");
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setPersonalMessage(msg != null ? msg : "");
            userRepository.save(user);
            return ResponseEntity.ok("Personal message updated.");
        }
        return ResponseEntity.status(404).body("User not found.");
    }

    @PostMapping("/sendMessage")
    public ResponseEntity<String> sendMessage(@RequestBody Message message) {
        if (message.getSender() == null || message.getReceiver() == null || message.getText() == null)
            return ResponseEntity.badRequest().body("Missing message details.");
        String time = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm"));
        messageRepository.save(new Message(message.getSender(), message.getReceiver(), message.getText(), time));
        return ResponseEntity.ok("OK");
    }

    @GetMapping("/messages")
    public List<Message> getMessages(@RequestParam String user) {
        return messageRepository.findBySenderOrReceiverOrderByIdAsc(user, user);
    }
}