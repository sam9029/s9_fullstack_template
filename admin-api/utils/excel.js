/*
 * @Author: your name
 * @Date: 2020-01-16 21:21:34
 * @LastEditTime: 2020-05-06 19:03:12
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /ad-api-nodejs/utils/excel.js
 */
const xlsx = require('xlsx');
const path = require('path');

exports.includeFile = (file, callback) => { // 读取文件
  // console.log("file: ", file)
  const workbook = xlsx.readFile(file);
  const sheetNames = workbook.SheetNames; //获取表明
  const sheet = workbook.Sheets[sheetNames[0]]; //通过表明得到表对象

  if(callback) callback(sheet)
  
  return xlsx.utils.sheet_to_json(sheet); //通过工具将表对象的数据读出来并转成json
};

exports.includeFileWithName = (file, sheetName, callback) => { // 读取文件
  // console.log("file: ", file)
  const workbook = xlsx.readFile(file);
  const sheetNames = workbook.SheetNames; //获取表明
  let name = sheetNames.includes(sheetName) ? sheetName : sheetNames[0]
  const sheet = workbook.Sheets[name]; //通过表明得到表对象
  if(callback) callback(sheet)
  return xlsx.utils.sheet_to_json(sheet); //通过工具将表对象的数据读出来并转成json
};

/**
 * @param headers 表头，数组
 * @param json 数据
 */
exports.exportFile = (headers, json) => {
  const head = headers.map((v, i) => Object.assign({}, {
    v: v,
    position: String.fromCharCode(65 + i) + 1
  })).reduce((prev, next) => Object.assign({}, prev, {[next.position]: {v: next.v}}), {});
  
  const data = json.map((v, i) => headers.map((k, j) => Object.assign({}, {
    v: v[k],
    position: String.fromCharCode(65 + j) + (i + 2)
  }))).reduce((prev, next) => prev.concat(next)).reduce((prev, next) => Object.assign({}, prev, {[next.position]: {v: next.v}}), {});
  
  // 合并 headers 和 data
  const output = Object.assign({}, head, data);
  // 获取所有单元格的位置
  const outputPos = Object.keys(output);
  // 计算出范围
  const ref = outputPos[0] + ':' + outputPos[outputPos.length - 1];
  // 构建 workbook 对象
  const wb = {
    SheetNames: ['mySheet'],
    Sheets: {
      'mySheet': Object.assign({}, output, {'!ref': ref})
    }
  };
  
  const absName = `/output/${new Date().getTime()}.xlsx`;
  
  
  // 导出 Excel
  xlsx.writeFile(wb, path.resolve("public" + absName));
  
  return absName;
};

exports.sizeTransform = (size) => {
  return size.replace(/×/g, "*");
};
