package com.service;

import com.domain.all;
import com.domain.allm;
import com.domain.ut;
import com.untils.PageResult;

import java.util.List;

public interface utService {
    public PageResult SelectPage(ut ut, int size, int current);
    public int insert(ut ut);
    public int delete(int id);
    public int edit(ut ut);
    public ut findById(int id);

    public all selectAll(int userId);

    public List<allm> selectAllm(int userId);
    public List<all> selectAll1();
//
    public List<ut> selectDetails(int userId, int mokuaiId);
//
public List<all> pipei(int userId);


}
