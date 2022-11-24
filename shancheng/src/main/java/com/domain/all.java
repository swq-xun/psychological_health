package com.domain;

public class all {
    public  int userId;


    public int getUserId() {
        return userId;
    }

    public void setUserId(int userId) {
        this.userId = userId;
    }


    public all(int userId, double fen, String guo, String username) {
        this.userId = userId;
        this.fen = fen;
        this.guo = guo;
        this.username = username;
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
