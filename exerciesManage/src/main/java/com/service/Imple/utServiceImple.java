package com.service.Imple;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.dao.UserDao;
import com.domain.all;
import com.domain.fenduan;
import com.domain.ut;
import com.domain.ut;
import com.service.utService;
import com.untils.PageResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class utServiceImple implements utService {
    @Autowired
    private com.dao.utDao utDao;
    @Autowired
    private com.dao.fenduanDao fenduanDao;
    @Autowired
    private UserDao userDao;
    @Override
    public PageResult SelectPage(ut ut, int size, int current) {
        try
        {

            IPage page=new Page(current,size);
            QueryWrapper<ut> queryWrapper = new QueryWrapper<ut>();
            queryWrapper.like("them",ut.getThem());
            queryWrapper.orderByAsc("xuhao");

            page=utDao.selectPage(page, queryWrapper);
            while(true)
            {
                if(page.getRecords().size()==0&&current>=1)
                {
                    page=new Page(current--,size);
                    page=utDao.selectPage(page, queryWrapper);

                }
                else
                {
                    break;
                }

            }

            return new PageResult(page.getTotal(),page.getRecords());




        }
        catch (Exception e)
        {
            return  null;
        }
    }

    @Override
    public int insert(ut ut) {

        int i=55;
        if((!ut.getDa().equals(ut.getOk())))
        {
            ut.setFen(0);
        }


        return utDao.insert(ut);
    }

    @Override
    public int delete(int id) {
        return utDao.deleteById(id);
    }

    @Override
    public int edit(ut ut) {
        return utDao.updateById(ut);
    }

    @Override
    public ut findById(int id) {
        return utDao.selectById(id);
    }

    @Override
    public List<all> selectAll(int userId) {
        QueryWrapper<ut> queryWrapper = new QueryWrapper<ut>();
        queryWrapper.eq("userId",userId);
        queryWrapper.select("sum(fen) as fen,biaoshi");
          queryWrapper.groupBy("biaoshi");
       List<Map<String, Object>> list=utDao.selectMaps(queryWrapper);

       List<all> list1=new ArrayList<>();
        for (Map item:list)
        {
              all a=new all(userId,item.get("biaoshi").toString(),Double.parseDouble(item.get("fen").toString()));

        double fen=Double.parseDouble(item.get("fen").toString());
            QueryWrapper<fenduan> queryWrapper1 = new QueryWrapper<fenduan>();
            queryWrapper1.ge("end",fen).le("start",fen);
        fenduan f=fenduanDao.selectOne(queryWrapper1);
          a.setGuo(f.getGuo());
              list1.add(a);
        }
        return list1;
    }

    @Override
    public List<ut> selectDetails(String biaoshi) {
        QueryWrapper<ut> queryWrapper = new QueryWrapper<ut>();
        queryWrapper.eq("biaoshi",biaoshi);
        return utDao.selectList(queryWrapper);
    }

    @Override
    public List<all> selectAll1() {
        QueryWrapper<ut> queryWrapper = new QueryWrapper<ut>();

        queryWrapper.select("sum(fen) as fen,userId,biaoshi");
        queryWrapper.groupBy("userId").groupBy("biaoshi");
        List<Map<String, Object>> list=utDao.selectMaps(queryWrapper);

        List<all> list1=new ArrayList<>();
        for (Map item:list)
        {
            all a=new all(Integer.parseInt(item.get("userId").toString()),item.get("biaoshi").toString(),Double.parseDouble(item.get("fen").toString()));

            double fen=Double.parseDouble(item.get("fen").toString());
            QueryWrapper<fenduan> queryWrapper1 = new QueryWrapper<fenduan>();
            queryWrapper1.ge("end",fen).le("start",fen);
            fenduan f=fenduanDao.selectOne(queryWrapper1);
            a.setGuo(f.getGuo());

          String username= userDao.selectById(item.get("userId").toString()).getUsername();
          a.setUsername(username);
            list1.add(a);
        }
        return list1;
    }
}
