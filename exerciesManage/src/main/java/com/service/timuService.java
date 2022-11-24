package com.service;

import com.domain.timu;
import com.untils.PageResult;

import java.util.List;

public interface timuService {
    public PageResult SelectPage(timu timu, int size, int current);
    public int insert(timu timu);
    public int delete(int id);
    public int edit(timu timu);
    public timu findById(int id);
    public List<timu> selectAll();
}
