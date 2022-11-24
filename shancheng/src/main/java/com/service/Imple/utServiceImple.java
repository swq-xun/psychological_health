package com.service.Imple;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.dao.UserDao;
import com.domain.*;
import com.service.utService;
import com.untils.PageResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class utServiceImple implements utService {
    @Autowired
    private com.dao.utDao utDao;
    @Autowired
    private com.dao.fenduanDao fenduanDao;
    @Autowired
    private UserDao userDao;
    @Autowired
    private com.dao.mokuaiDao mokuaiDao;
    @Override
    public PageResult SelectPage(ut ut, int size, int current) {
        try
        {

            IPage page=new Page(current,size);
            QueryWrapper<com.domain.ut> queryWrapper = new QueryWrapper<com.domain.ut>();
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
    public all selectAll(int userId) {

        QueryWrapper<ut> queryWrapper = new QueryWrapper<ut>();
        queryWrapper.eq("userId",userId);
         List<ut> list=utDao.selectList(queryWrapper);

        String username=userDao.selectById(userId).getUsername();
         double fen=0;
        for (ut item:list)
        {
              fen+=item.getFen()*(Double.parseDouble(mokuaiDao.selectById(item.getMokuaiId()).getQuanzhon())/100);
        }
        QueryWrapper<fenduan> queryWrapper1 = new QueryWrapper<fenduan>();
        queryWrapper1.ge("end",fen).le("start",fen);
        fenduan f=fenduanDao.selectOne(queryWrapper1);
       String guo=f.getGuo();
       all a=new all(userId,fen,guo,username);
       return  a;

    }

    @Override
    public List<allm> selectAllm(int userId) {
        List<allm> l=new ArrayList<>();
        List<mokuai> list=mokuaiDao.selectList(null);

        for (mokuai item:list)
        {
            allm a=new allm();
            a.setId(item.getId());
            a.setName(item.getName());

                    QueryWrapper<ut> queryWrapper = new QueryWrapper<ut>();
            queryWrapper.eq("userId",userId);
            queryWrapper.eq("mokuaiId",item.getId());
            queryWrapper.select("sum(fen) as fen");
            List<Map<String, Object>> list1=utDao.selectMaps(queryWrapper);

                for (Map item1:list1)
                {
                    if(item1!=null)
                    {
                        a.setScore(Double.parseDouble(item1.get("fen").toString()));
                    }
                    else
                    {
                        a.setScore(0);
                    }


                }




        a.setZscore(a.getScore()*(Double.parseDouble(item.getQuanzhon())/100));
        l.add(a);
        }
        return l;
    }

    @Override
    public List<ut> selectDetails(int userId, int mokuaiId) {
        QueryWrapper<ut> queryWrapper = new QueryWrapper<ut>();
        queryWrapper.eq("userId",userId);
        queryWrapper.eq("mokuaiId",mokuaiId);
        return utDao.selectList(queryWrapper);
    }

    @Override
    public List<all> pipei(int userId) {

         all a=selectAll(userId);
        List<all>  l=selectAll1();
        List<all> list=new ArrayList<>();
        for (all item:l)
        {
            if(item.getUserId()!=userId)
            {
                list.add(item);
            }

        }

        if(list.size()==0)
        {
            return  null;
        }
        else  if(list.size()==1)
        {
            List<all> S=new ArrayList<>();
            S.add(list.get(0));
            return  S;
        }
        else
        {
            all q=list.get(0);
            for (int i=1;i<list.size();i++)
            {
               if(Math.abs(list.get(i).getFen()-a.getFen())<Math.abs(q.getFen()-a.getFen()))
               {
                       q=list.get(i);
               }

            }
            List<all> S=new ArrayList<>();
            S.add(q);
            return  S;

        }
    }

    @Override
    public List<all> selectAll1() {
        List<all> l=new ArrayList<>();
        QueryWrapper<user> queryWrapper1 = new QueryWrapper<user>();

        queryWrapper1.eq("type",1);
        List<user> users=userDao.selectList(queryWrapper1);

        for (user item:users)
        {
            QueryWrapper<ut> queryWrapper = new QueryWrapper<ut>();
            queryWrapper.eq("userId",item.getId());
            List<ut> list=utDao.selectList(queryWrapper);
        if(list.size()==0)
        {
            continue;
        }
            String username=userDao.selectById(item.getId()).getUsername();
            double fen=0;
            for (ut item1:list)
            {
                fen+=item1.getFen()*(Double.parseDouble(mokuaiDao.selectById(item1.getMokuaiId()).getQuanzhon())/100);
            }
            QueryWrapper<fenduan> queryWrapper2 = new QueryWrapper<fenduan>();
            queryWrapper2.ge("end",fen).le("start",fen);
            fenduan f=fenduanDao.selectOne(queryWrapper2);
            String guo=f.getGuo();
            all a=new all(item.getId(),fen,guo,username);
            l.add(a);


        }
         return  l;
    }
}
