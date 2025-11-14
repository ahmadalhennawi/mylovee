package com.mylove.lamoescha.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
@CrossOrigin("*")
public class MyloveController {

    @GetMapping("/mylove")
    public String root(Model model) {
        model.addAttribute("showTestButton", true);
        return "mylove";
    }

}
