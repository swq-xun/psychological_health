package com.untils;





import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.web.multipart.MultipartFile;

import java.io.StringReader;
import java.text.DecimalFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class excelTools {
    public Workbook getWorkbook(MultipartFile file)
    {
        String fileType = file.getOriginalFilename().split("\\.")[1];
        Workbook workbook = new XSSFWorkbook();
        try
        {
            if(fileType.equals("xls"))
            {
                workbook = new HSSFWorkbook(file.getInputStream());
            }
            else if(fileType.equals("xlsx"))
            {
                workbook = new XSSFWorkbook(file.getInputStream());
            }
            else
                {
                    return null;
                }
        }
        catch(Exception e)
        {
            return null;
        }
        return workbook;

    }

    public List<Map<String,String>> getExcelValues(Workbook workbook, String[] colNames, int SheetNum)
    {
        //初始化基础数据
        List<Map<String,String>> list = new ArrayList<>();	//用于存储最终结果
        Map<String,String> map = new HashMap<>();	//用于逐一存储表格的每一行数据
        Sheet sheet = workbook.getSheetAt(SheetNum);	//获取Excel文件的表格
        int rowNum = sheet.getPhysicalNumberOfRows();	//获取当前表格最大行数
        //循环遍历表格的每一行，获取每一行的值(i的初始值决定从表格的第几行开始)
        for(int i = 0 ; i < rowNum ; i ++){
            map = new HashMap<>();	//清除map中的数据
            Row row = sheet.getRow(i);	//获取表格中第i行的数据
            //循环遍历表格第i行的每一个单元格的值(j的初始值决定从表格的第几列开始）
            for(int j = 0 ; j < colNames.length ; j ++){
                String cellData=null;
                try{	//这里可能会报错，try{}catch{}一下
                    cellData = (String)row.getCell(j).getStringCellValue();
                }catch(Exception e){
                    try{	//如果某一个单元格为纯数字的字符串时会报错，需特殊处理
                        String[] a = new DecimalFormat().format(row.getCell(j).getNumericCellValue()).split(",");
                        cellData = a[0];
                        for(int k = 1; k < a.length ; k++){
                            cellData += a[k];
                        }
                    }catch(Exception e1){
                        cellData = null;
                    }
                }
                map.put(colNames[j],cellData);		//将第i行第j个单元格数据存入map中
            }
            list.add(map);	//将第i行数据存入list中
        }
        return list;
    }
}
