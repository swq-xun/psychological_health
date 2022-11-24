package com.service;

import com.domain.mokuai;
import com.untils.PageResult;

public interface mokuaiService {
    public PageResult SelectPage(mokuai mokuai, int size, int current);
    public int insert(mokuai mokuai);
    public int delete(int id);
    public int edit(mokuai mokuai);
    public mokuai findById(int id);
}
