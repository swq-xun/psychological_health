package com.service;

import com.domain.user;
import com.untils.PageResult;

import java.util.List;

public interface userService {
    public PageResult SelectPage(user user, int size, int current);
    public PageResult SelectPageStudent(user user, int size, int current);
    public int insert(user user);
    public int delete(int id);
    public int edit(user user);
    public user findById(int id);
    public user login(user user);
    public user selectByUserName(String username);
    public List<user> selectAllByStudent();
}
