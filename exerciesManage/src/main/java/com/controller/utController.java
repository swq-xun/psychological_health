package com.controller;

import com.domain.all;
import com.domain.ut;
import com.untils.PageResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/ut")
public class utController {
    @Autowired
    public com.service.utService utService;

    @PostMapping("/Save")
    public  int Save(@RequestBody List<ut> uts)
    {
        UUID uuid = UUID.randomUUID();

        for (ut item:uts)
        {
            item.setBiaoshi(uuid.toString());
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

        return utService.selectAll(userId);

    }


    @GetMapping("/selectAll1")
    public List<all> selectAll1()
    {

        return utService.selectAll1();

    }

    @GetMapping("/selectDetails/{biaoshi}")
    public List<ut> selectDetails(@PathVariable String biaoshi) {
          return  utService.selectDetails(biaoshi);
    }
}
