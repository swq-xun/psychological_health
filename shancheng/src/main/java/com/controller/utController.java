package com.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.domain.all;
import com.domain.allm;
import com.domain.ut;
import com.untils.PageResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/ut")
public class utController {
    @Autowired
    public com.service.utService utService;
    @Autowired
    private com.dao.utDao utDao;
    @PostMapping("/Save")
    public  int Save(@RequestBody List<ut> uts)
    {

        QueryWrapper<ut> queryWrapper = new QueryWrapper<com.domain.ut>();
        queryWrapper.eq("userId",uts.get(0).getUserId());

        utDao.delete(queryWrapper);

        for (ut item:uts)
        {

            utService.insert(item);
        }
        return 1;

    }
    @DeleteMapping("/Delete/{id}")
    public int Delete(@PathVariable Integer id)
    {

        return utService.delete(id);
    }


    @GetMapping("/SelectPage/{size}/{current}")
    public PageResult selectPage(@PathVariable Integer size, @PathVariable Integer current, ut ut)
    {
        return utService.SelectPage(ut,size,current);
    }





    @GetMapping("/findById/{id}")
    public ut findById(@PathVariable Integer id)
    {

        return  utService.findById(id);
    }



    @PutMapping("/Update")
    public int Update(@RequestBody ut ut)
    {

        return  utService.edit(ut);
    }
    @GetMapping("/selectAll/{userId}")
    public List<all> selectAll(@PathVariable int userId)
    {
        List<all> list=new ArrayList<>();

        all a=utService.selectAll(userId);
        list.add(a);
        return list;

    }


    @GetMapping("/selectAllm/{userId}")
    public List<allm> selectAllm(@PathVariable int userId)
    {


       return  utService.selectAllm(userId);



    }


    @GetMapping("/selectAll1")
    public List<all> selectAll1()
    {

        return utService.selectAll1();

    }
//
    @GetMapping("/selectDetails/{userId}/{mokuaiId}")
    public List<ut> selectDetails(@PathVariable int userId,@PathVariable int mokuaiId) {



        return  utService.selectDetails(userId,mokuaiId);
    }


    @GetMapping("/pi/{userId}")
    public List<all> pi(@PathVariable int userId)
    {


        return utService.pipei(userId);

    }
}
