package com.controller;

import com.domain.mokuai;
import com.untils.PageResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/mokuai")
public class mokuaiController {
    @Autowired
    public com.service.mokuaiService mokuaiService;

    @PostMapping("/Save")
    public  int Save(@RequestBody mokuai mokuai)
    {
        return mokuaiService.insert(mokuai);

    }
    @DeleteMapping("/Delete/{id}")
    public int Delete(@PathVariable Integer id)
    {

        return mokuaiService.delete(id);
    }


    @GetMapping("/SelectPage/{size}/{current}")
    public PageResult selectPage(@PathVariable Integer size, @PathVariable Integer current, mokuai mokuai)
    {
        return mokuaiService.SelectPage(mokuai,size,current);
    }





    @GetMapping("/findById/{id}")
    public mokuai findById(@PathVariable Integer id)
    {

        return  mokuaiService.findById(id);
    }
    @PutMapping("/Update")
    public int Update(@RequestBody mokuai mokuai)
    {

        return  mokuaiService.edit(mokuai);
    }
}
