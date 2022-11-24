package com.service.Imple;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.domain.timu;
import com.service.timuService;
import com.untils.PageResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class timuServiceImple implements timuService {
    @Autowired
    private com.dao.timuDao timuDao;
    @Override
    public PageResult SelectPage(timu timu, int size, int current) {
        try
        {

            IPage page=new Page(current,size);
            QueryWrapper<com.domain.timu> queryWrapper = new QueryWrapper<com.domain.timu>();
            queryWrapper.like("them",timu.getThem());
            queryWrapper.eq("mokuaiId",timu.getMokuaiId());
            queryWrapper.orderByAsc("xuhao");

            page=timuDao.selectPage(page, queryWrapper);
            while(true)
            {
                if(page.getRecords().size()==0&&current>=1)
                {
                    page=new Page(current--,size);
                    page=timuDao.selectPage(page, queryWrapper);

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
    public int insert(timu timu) {
        return timuDao.insert(timu);
    }

    @Override
    public int delete(int id) {
        return timuDao.deleteById(id);
    }

    @Override
    public int edit(timu timu) {
        return timuDao.updateById(timu);
    }

    @Override
    public timu findById(int id) {
        return timuDao.selectById(id);
    }

    @Override
    public List<timu> selectAll() {
        return timuDao.selectList(null);
    }
}
