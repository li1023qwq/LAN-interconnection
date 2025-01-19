package com.example.lanserver.controller;

import com.example.lanserver.model.ScreenMessage;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

@Controller
public class ScreenShareController {

    @MessageMapping("/screen.start")
    @SendTo("/topic/screen")
    public ScreenMessage startShare(ScreenMessage message) {
        message.setType("start");
        return message;
    }

    @MessageMapping("/screen.stop")
    @SendTo("/topic/screen")
    public ScreenMessage stopShare(ScreenMessage message) {
        message.setType("stop");
        return message;
    }

    @MessageMapping("/screen.offer")
    @SendTo("/topic/screen")
    public ScreenMessage sendOffer(ScreenMessage message) {
        message.setType("offer");
        return message;
    }

    @MessageMapping("/screen.answer")
    @SendTo("/topic/screen")
    public ScreenMessage sendAnswer(ScreenMessage message) {
        message.setType("answer");
        return message;
    }

    @MessageMapping("/screen.candidate")
    @SendTo("/topic/screen")
    public ScreenMessage sendCandidate(ScreenMessage message) {
        message.setType("candidate");
        return message;
    }

    @MessageMapping("/screen.view")
    @SendTo("/topic/screen")
    public ScreenMessage handleViewRequest(ScreenMessage message) {
        message.setType("view");
        return message;
    }
} 