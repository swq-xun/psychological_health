package com.controller;

import com.domain.liaotian;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/liaotian")
public class liaotianController {
    @Autowired
    public com.service.liaotianService liaotianService;
    @PostMapping("/Save")
    public  int Save(@RequestBody liaotian liaotian)
    {
        int a=55;
        return liaotianService.insert(liaotian);

    }



    @PostMapping("/Select")
    public  String Select(@RequestBody liaotian liaotian)
    {
        return liaotianService.select(liaotian);

    }
}
