package com.service.Imple;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.domain.fenduan;
import com.domain.fenduan;
import com.service.fenduanService;
import com.untils.PageResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class fenduanServiceImple implements fenduanService {
    @Autowired
    private com.dao.fenduanDao fenduanDao;


    @Override
    public int insert(fenduan fenduan) {
        return fenduanDao.insert(fenduan);
    }

    @Override
    public int delete(int id) {
        return fenduanDao.deleteById(id);
    }

    @Override
    public int edit(fenduan fenduan) {
        return fenduanDao.updateById(fenduan);
    }

    @Override
    public fenduan findById(int id) {
        return fenduanDao.selectById(id);
    }

    @Override
    public List<fenduan> selectAll() {
        return fenduanDao.selectList(null);
    }
}
