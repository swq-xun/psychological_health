package com.service.Imple;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.domain.liaotian;
import com.service.liaotianService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class liaotianServiceImple implements liaotianService {
    @Autowired
    private com.dao.liaotianDao liaotianDao;
    @Override
    public int insert(liaotian liaotian) {
        QueryWrapper<com.domain.liaotian> queryWrapper = new QueryWrapper<com.domain.liaotian>();
        queryWrapper.eq("one",liaotian.getOne()).eq("two",liaotian.getTwo()).or().eq("one",liaotian.getTwo()).eq("two",liaotian.getOne());

        com.domain.liaotian liaotian1=liaotianDao.selectOne(queryWrapper);
        if(liaotian1==null)
        {
            return liaotianDao.insert(liaotian);
        }
        else
        {
            liaotian1.setContent(liaotian1.getContent()+liaotian.getContent());
            return  liaotianDao.updateById(liaotian1);
        }


    }



    @Override
    public String select(liaotian liaotian) {
        QueryWrapper<com.domain.liaotian> queryWrapper = new QueryWrapper<com.domain.liaotian>();
        queryWrapper.eq("one",liaotian.getOne()).eq("two",liaotian.getTwo()).or().eq("one",liaotian.getTwo()).eq("two",liaotian.getOne());

        com.domain.liaotian liaotian1=liaotianDao.selectOne(queryWrapper);
        if(liaotian1==null)
        {
            return "";
        }
        else
        {
            return liaotian1.getContent();
        }



    }
}
