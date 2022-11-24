package com.controller;

import com.domain.fenduan;
import com.untils.PageResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/fenduan")
public class fenduanController {
    @Autowired
    public com.service.fenduanService fenduanService;

    @PostMapping("/Save")
    public  int Save(@RequestBody fenduan fenduan)
    {
        return fenduanService.insert(fenduan);

    }
    @DeleteMapping("/Delete/{id}")
    public int Delete(@PathVariable Integer id)
    {

        return fenduanService.delete(id);
    }








    @GetMapping("/findById/{id}")
    public fenduan findById(@PathVariable Integer id)
    {

        return  fenduanService.findById(id);
    }
    @PutMapping("/Update")
    public int Update(@RequestBody fenduan fenduan)
    {

        return  fenduanService.edit(fenduan);
    }

    @GetMapping("/selectAll")
    public List<fenduan> selectAll()
    {

        return  fenduanService.selectAll();
    }
}
