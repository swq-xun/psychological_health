package com.controller;

import com.domain.user;
import com.service.userService;
import com.untils.PageResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/user")
public class userController {
    @Autowired
    public userService userService;

    @PostMapping("/Save")
    public  int Save(@RequestBody user user)
    {
        return userService.insert(user);

    }
    @DeleteMapping("/Delete/{id}")
    public int Delete(@PathVariable Integer id)
    {

        return userService.delete(id);
    }
    @PutMapping("/Update")
    public int Update(@RequestBody user user)
    {
        return  userService.edit(user);
    }

    @GetMapping("/SelectPage/{size}/{current}")
    public PageResult selectPage(@PathVariable Integer size, @PathVariable Integer current,user user)
    {
        return  userService.SelectPage(user,size,current);
    }

    @GetMapping("/SelectPageStudent/{size}/{current}")
    public PageResult selectPageStudent(@PathVariable Integer size, @PathVariable Integer current,user user)
    {
        return  userService.SelectPageStudent(user,size,current);
    }

    @GetMapping("/findById/{id}")
    public user findById(@PathVariable Integer id)
    {

        return  userService.findById(id);
    }

    @PostMapping("/login")
    public  Boolean login(@RequestBody user user)
    {
       user user1= userService.login(user);
       if (user1==null)
       {
           return  false;
       }
       else
       {
           return  true;
       }

    }
    //获取当前登录用户的用户名
    @GetMapping("/getUsername")
    public String getUsername(){

            org.springframework.security.core.userdetails.User user =
                    (org.springframework.security.core.userdetails.User)
                            SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            return user.getUsername();

    }

    @GetMapping("/getByUserName")
    public int getByUserName(String username){

        return userService.selectByUserName(username).getType();

    }

    @GetMapping("/getByUserId")
    public int getByUserId(String username){

        return userService.selectByUserName(username).getId();

    }



}
