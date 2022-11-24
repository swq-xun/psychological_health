package com.controller;

import com.domain.timu;
import com.service.timuService;
import com.untils.PageResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/timu")
public class timuController {
    @Autowired
    public com.service.timuService timuService;

    @PostMapping("/Save")
    public  int Save(@RequestBody timu timu)
    {
        return timuService.insert(timu);

    }
    @DeleteMapping("/Delete/{id}")
    public int Delete(@PathVariable Integer id)
    {

        return timuService.delete(id);
    }


    @GetMapping("/SelectPage/{size}/{current}")
    public PageResult selectPage(@PathVariable Integer size, @PathVariable Integer current, timu timu)
    {
        return timuService.SelectPage(timu,size,current);
    }





    @GetMapping("/findById/{id}")
    public timu findById(@PathVariable Integer id)
    {

        return  timuService.findById(id);
    }
    @PutMapping("/Update")
    public int Update(@RequestBody timu timu)
    {

        return  timuService.edit(timu);
    }

    @GetMapping("/selectAll")
    public List<timu> selectAll()
    {

        return  timuService.selectAll();
    }
}
