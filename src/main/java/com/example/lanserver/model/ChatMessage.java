package com.example.lanserver.model;

import lombok.Data;

@Data
public class ChatMessage {
    private String sender;
    private String content;
    private MessageType type;
    private String oldUsername;
    private String avatar;
    
    public enum MessageType {
        CHAT,
        JOIN,
        LEAVE,
        RENAME
    }
} 