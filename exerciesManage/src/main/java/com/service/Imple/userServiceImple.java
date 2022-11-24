package com.service.Imple;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.dao.UserDao;
import com.domain.user;
import com.service.userService;
import com.untils.PageResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class userServiceImple implements userService {
    @Autowired
    private UserDao userDao;

    @Override
    public PageResult SelectPage(user user, int size, int current) {
        try
        {

                  IPage page=new Page(current,size);
                  QueryWrapper<user> queryWrapper = new QueryWrapper<user>();
            queryWrapper.like("username",user.getUsername());
            queryWrapper.like("type",1);
                  page=userDao.selectPage(page, queryWrapper);
                  while (true)
                  {
                      if(page.getRecords().size()==0&&current>1)
                      {
                          page=new Page(current-1,size);
                          page=userDao.selectPage(page, queryWrapper);
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
    public PageResult SelectPageStudent(user user, int size, int current) {
        try
        {
            if(user.getUsername()=="")
            {
                IPage page=new Page(current,size);
                QueryWrapper<user> queryWrapper = new QueryWrapper<user>();
                queryWrapper.eq("type",1);
                page=userDao.selectPage(page, queryWrapper);
                if(page.getRecords().size()==0&&current>1)
                {
                    page=new Page(current-1,size);
                    page=userDao.selectPage(page, null);
                }


                return new PageResult(page.getTotal(),page.getRecords());
            }
            else
            {
                IPage page=new Page(current,size);
                QueryWrapper<user> queryWrapper = new QueryWrapper<user>();
                queryWrapper.like("username",user.getUsername());
                queryWrapper.eq("type",1);
                page=userDao.selectPage(page, queryWrapper);
                if(page.getRecords().size()==0&&current>1)
                {
                    page=new Page(current-1,size);
                    page=userDao.selectPage(page, queryWrapper);
                }


                return new PageResult(page.getTotal(),page.getRecords());
            }

        }
        catch (Exception e)
        {
            return  null;
        }
    }

    @Override
    public int insert(user user) {
        return userDao.insert(user);
    }

    @Override
    public int delete(int id) {
        return userDao.deleteById(id);
    }

    @Override
    public int edit(user user) {
        return userDao.updateById(user);
    }

    @Override
    public user findById(int id) {
        return userDao.selectById(id);
    }

    @Override
    public user login(user user) {
        QueryWrapper<user> queryWrapper = new QueryWrapper<user>();
        queryWrapper.eq("username",user.getUsername());
        queryWrapper.eq("password",user.getPassword());
        user user1=userDao.selectOne(queryWrapper);
        if(user1==null)
        {
            return  null;
        }
       return  user1;
    }

    @Override
    public user selectByUserName(String username) {
        QueryWrapper<user> queryWrapper = new QueryWrapper<user>();
        queryWrapper.eq("username",username);
        return userDao.selectOne(queryWrapper);
    }

    @Override
    public List<user> selectAllByStudent() {
        QueryWrapper<user> queryWrapper = new QueryWrapper<user>();
        queryWrapper.eq("type",3);
        return userDao.selectList(queryWrapper);
    }

}
