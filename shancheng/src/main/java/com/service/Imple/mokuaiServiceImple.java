package com.service.Imple;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.domain.mokuai;
import com.service.mokuaiService;
import com.untils.PageResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class mokuaiServiceImple implements mokuaiService {
    @Autowired
    private com.dao.mokuaiDao mokuaiDao;
    @Override
    public PageResult SelectPage(mokuai mokuai, int size, int current) {
        try
        {

            IPage page=new Page(current,size);
            QueryWrapper<com.domain.mokuai> queryWrapper = new QueryWrapper<com.domain.mokuai>();
            queryWrapper.like("name",mokuai.getName());


            page=mokuaiDao.selectPage(page, queryWrapper);
            while(true)
            {
                if(page.getRecords().size()==0&&current>=1)
                {
                    page=new Page(current--,size);
                    page=mokuaiDao.selectPage(page, queryWrapper);

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
    public int insert(mokuai mokuai) {
        return mokuaiDao.insert(mokuai);
    }

    @Override
    public int delete(int id) {
        return mokuaiDao.deleteById(id);
    }

    @Override
    public int edit(mokuai mokuai) {
        return mokuaiDao.updateById(mokuai);
    }

    @Override
    public mokuai findById(int id) {
        return mokuaiDao.selectById(id);
    }
}
