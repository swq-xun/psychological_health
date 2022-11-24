package com.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

@TableName("timu")
public class timu {
    @TableId(type= IdType.AUTO)
    private int id;
    @TableField("xuhao")
    private int xuhao;
    @TableField("them")
    private String them;

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public int getXuhao() {
        return xuhao;
    }

    public void setXuhao(int xuhao) {
        this.xuhao = xuhao;
    }

    public String getThem() {
        return them;
    }

    public void setThem(String them) {
        this.them = them;
    }

    public String getOne() {
        return one;
    }

    public void setOne(String one) {
        this.one = one;
    }

    public String getTwo() {
        return two;
    }

    public void setTwo(String two) {
        this.two = two;
    }

    public String getThree() {
        return three;
    }

    public void setThree(String three) {
        this.three = three;
    }

    public String getFour() {
        return four;
    }

    public void setFour(String four) {
        this.four = four;
    }

    public String getOk() {
        return ok;
    }

    public void setOk(String ok) {
        this.ok = ok;
    }

    @TableField("one")
    private String one;
    @TableField("two")
    private String two;
    @TableField("three")
    private String three;

    public double getFen() {
        return fen;
    }

    public void setFen(double fen) {
        this.fen = fen;
    }

    @TableField("four")
    private String four;
    @TableField("ok")
    private String ok;

    public String getDa() {
        return da;
    }

    public int getMokuaiId() {
        return mokuaiId;
    }

    public void setMokuaiId(int mokuaiId) {
        this.mokuaiId = mokuaiId;
    }

    public void setDa(String da) {
        this.da = da;
    }

    @TableField("fen")
    private double fen;
    @TableField("mokuaiId")
    private int mokuaiId;
    @TableField("da")
    private String da;
}
