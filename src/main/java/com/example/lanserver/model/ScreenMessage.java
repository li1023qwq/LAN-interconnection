package com.example.lanserver.model;

import lombok.Data;

@Data
public class ScreenMessage {
    private String type;
    private String sender;
    private Object offer;
    private Object answer;
    private Object candidate;
    private String viewerId;
} 