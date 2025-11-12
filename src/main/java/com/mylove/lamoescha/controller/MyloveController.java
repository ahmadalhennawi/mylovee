package com.mylove.lamoescha.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class MyloveController {

    @GetMapping({"/", "/mylove"})
    public String mylove() {
        return "mylove";
    }
}
