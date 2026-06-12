package com.example.chatapp;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = true)
    private String status = "Online";

    @Column(nullable = true)
    private String personalMessage = "";

    @Column(nullable = true)
    private String profilePicture = "";

    public User() {}

    public User(String username, String password) {
        this.username = username;
        this.password = password;
        this.status = "Online";
        this.personalMessage = "";
        this.profilePicture = "";
    }

    public String getProfilePicture() {
        return profilePicture;
    }

    public void setProfilePicture(String profilePicture) {
        this.profilePicture = profilePicture;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getStatus() {
        return status != null ? status : "Online";
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPersonalMessage() {
        return personalMessage != null ? personalMessage : "";
    }

    public void setPersonalMessage(String personalMessage) {
        this.personalMessage = personalMessage;
    }
}
