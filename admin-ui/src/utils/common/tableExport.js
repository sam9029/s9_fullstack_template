import XLSX from 'xlsx';
import FileSaver from 'file-saver';
function s2ab(s) {
  if (typeof ArrayBuffer !== 'undefined') {
    var buf = new ArrayBuffer(s.length);
    var view = new Uint8Array(buf);
    for (var i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xff;
    return buf;
  } else {
    var buf = new Array(s.length);
    for (var i = 0; i != s.length; ++i) buf[i] = s.charCodeAt(i) & 0xff;
    return buf;
  }
}
/**
 * 导出xlsx 数据、文件名
 * @param {*} exportData 导出数据
 * @param {*} downLoadName  导出文件名称
 */
function exportXlsxData(exportData, downLoadName) {
  // getData获取数据的方法 tableItem 表格数据 downLoadName 下载的文件名称
  const defaultCellStyle = {
    font: { name: 'Verdana', sz: 11, color: 'FF00FF88' },
    fill: { fgColor: { rgb: 'FFFFAA00' } },
  };
  const wopts = {
    bookType: 'xlsx',
    bookSST: false,
    type: 'binary',
    defaultCellStyle: defaultCellStyle,
    showGridLines: false,
  };
  const wb = { SheetNames: ['Sheet1'], Sheets: {}, Props: {} };
  wb.Sheets['Sheet1'] = XLSX.utils.json_to_sheet(exportData);

  //创建二进制对象写入转换好的字节流
  let tmpDown = new Blob([s2ab(XLSX.write(wb, wopts))], { type: 'application/octet-stream' });
  FileSaver.saveAs(tmpDown, downLoadName + '.xlsx');
}

/**
 * 导入xlsx前端解析数据
 * @param {*} file
 * @param {*} requireFields 必填字段 中文名称
 */
function importXlsxData(file, that, requireFields) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();
    reader.onload = function (e) {
      let data = e.target.result;
      let wb = XLSX.read(data, { type: 'binary' });

      // wb.SheetNames[0]是获取Sheets中第一个Sheet的名字
      // wb.Sheets[Sheet名]获取第一个Sheet的数据
      let sheet = wb.Sheets[wb.SheetNames[0]];

      let resData = XLSX.utils.sheet_to_json(sheet) || [];
      // 判断必填
      if (requireFields && requireFields.length) {
        for (let i = 0, len = resData.length; i < len; i++) {
          let item = resData[i];
          for (let r = 0, length = requireFields.length; r < length; r++) {
            let key = requireFields[r];
            if (Object.prototype.toString.call(item[key]) == '[object Undefined]') {
              let str = `第${r + 1}行，「${key}」为必填`;
              that.$notify.error(str);
              reject(str);
            }
          }
        }
      }
      // 抛出结果
      resolve(resData);
    };
    reader.readAsBinaryString(file);
  });
}

function exportMutilpleXlsxData(sheets, downLoadName) {
  const defaultCellStyle = {
    font: { name: 'Verdana', sz: 11, color: 'FF00FF88' },
    fill: { fgColor: { rgb: 'FFFFAA00' } },
  };
  const wopts = {
    bookType: 'xlsx',
    bookSST: false,
    type: 'binary',
    defaultCellStyle: defaultCellStyle,
    showGridLines: false,
  };
  const wb = { SheetNames: [], Sheets: {}, Props: {} };

  for (let i = 0; i < sheets.length; i++) {
    const { sheetName, workSheet } = sheets[i];
    wb.SheetNames.push(sheetName);
    wb.Sheets[sheetName] = XLSX.utils.json_to_sheet(workSheet);
  }

  //创建二进制对象写入转换好的字节流
  let tmpDown = new Blob([s2ab(XLSX.write(wb, wopts))], { type: 'application/octet-stream' });
  FileSaver.saveAs(tmpDown, downLoadName + '.xlsx');
}

export { exportXlsxData, exportMutilpleXlsxData, importXlsxData };
