package com.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

@TableName("fenduan")
public class fenduan {
    @TableId(type= IdType.AUTO)
    private int id;
    @TableField("start")
    private Double start;

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public Double getStart() {
        return start;
    }

    public void setStart(Double start) {
        this.start = start;
    }

    public Double getEnd() {
        return end;
    }

    public void setEnd(Double end) {
        this.end = end;
    }

    public String getGuo() {
        return guo;
    }

    public void setGuo(String guo) {
        this.guo = guo;
    }

    @TableField("end")
    private Double end;
    @TableField("guo")
    private String guo;
}
