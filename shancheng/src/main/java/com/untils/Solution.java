package com.untils;

public class Solution {

    public static double pipei(String Str_1,String Str_2)
    {
//        String Str_1="abcdefghijklmuvwxyz";
//        String Str_2="ijkabclmdefghpq";
        //length
        int Length1=Str_1.length();
        int Length2=Str_2.length();

        int Distance=0;
        if (Length1==0) {
            Distance=Length2;
        }
        if(Length2==0)
        {
            Distance=Length1;
        }
        if(Length1!=0&&Length2!=0){
            int[][] Distance_Matrix=new int[Length1+1][Length2+1];
            //编号
            int Bianhao=0;
            for (int i = 0; i <= Length1; i++) {
                Distance_Matrix[i][0]=Bianhao;
                Bianhao++;
            }
            Bianhao=0;
            for (int i = 0; i <=Length2; i++) {
                Distance_Matrix[0][i]=Bianhao;
                Bianhao++;
            }


            char[] Str_1_CharArray=Str_1.toCharArray();
            char[] Str_2_CharArray=Str_2.toCharArray();


            for (int i = 1; i <= Length1; i++) {
                for(int j=1;j<=Length2;j++){
                    if(Str_1_CharArray[i-1]==Str_2_CharArray[j-1]){
                        Distance=0;
                    }
                    else{
                        Distance=1;
                    }

                    int Temp1=Distance_Matrix[i-1][j]+1;
                    int Temp2=Distance_Matrix[i][j-1]+1;
                    int Temp3=Distance_Matrix[i-1][j-1]+Distance;

                    Distance_Matrix[i][j]=Temp1>Temp2?Temp2:Temp1;
                    Distance_Matrix[i][j]=Distance_Matrix[i][j]>Temp3?Temp3:Distance_Matrix[i][j];

                }

            }

            Distance=Distance_Matrix[Length1][Length2];
        }

        double Aerfa=1-1.0*Distance/(Length1>Length2?Length1:Length2);
        System.out.println(Aerfa);
        return Aerfa;
    }
}
