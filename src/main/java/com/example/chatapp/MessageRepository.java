package com.example.chatapp;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findBySenderOrReceiverOrderByIdAsc(String sender, String receiver);
}
