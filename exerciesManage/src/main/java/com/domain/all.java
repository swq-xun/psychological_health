package com.domain;

public class all {
    public  int userId;
    public String biaoshi;

    public int getUserId() {
        return userId;
    }

    public void setUserId(int userId) {
        this.userId = userId;
    }

    public String getBiaoshi() {
        return biaoshi;
    }

    public void setBiaoshi(String biaoshi) {
        this.biaoshi = biaoshi;
    }

    public all(int userId, String biaoshi, double fen) {
        this.userId = userId;
        this.biaoshi = biaoshi;
        this.fen = fen;
    }

    public String getGuo() {
        return guo;
    }

    public void setGuo(String guo) {
        this.guo = guo;
    }

    public double getFen() {
        return fen;
    }

    public void setFen(double fen) {
        this.fen = fen;
    }

    public  double fen;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public  String guo;

    public  String username;
}
