package com.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

@TableName("mokuai")
public class mokuai {
    @TableId(type= IdType.AUTO)
    private int id;
    @TableField("name")
    private String name;

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getQuanzhon() {
        return quanzhon;
    }

    public void setQuanzhon(String quanzhon) {
        this.quanzhon = quanzhon;
    }

    @TableField("quanzhon")
    private String quanzhon;
}
