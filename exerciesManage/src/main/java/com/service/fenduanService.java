package com.service;

import com.domain.fenduan;
import com.untils.PageResult;

import java.util.List;

public interface fenduanService {

    public int insert(fenduan fenduan);
    public int delete(int id);
    public int edit(fenduan fenduan);
    public fenduan findById(int id);
    public List<fenduan> selectAll();
}
