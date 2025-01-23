const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

/**
 * ## 复制模板文件夹
 * npm run gen:view
 * or
 * npm run gen:view -- src\views\Test
 *
 * ## 复制单个模板文件
 * npm run gen:view -- editDialog.vue
 */

//#region ===== tools
/** 日志工具 */
var $log = {};
var LOG_TYPE_MAPPER = {
  success: 'green',
  error: 'red',
  process: 'blue',
  warning: 'yellow',
  info: 'gray',
};
(function () {
  const isChalkExist = typeof chalk !== 'undefined';
  Reflect.ownKeys(LOG_TYPE_MAPPER).forEach((prop) => {
    if (isChalkExist)
      $log[prop] = (val) =>
        console.log(chalk[LOG_TYPE_MAPPER[prop]](`[${prop.toUpperCase()}][${val}]`));
    else $log[prop] = (val) => console.log(`[${val}]`);
  });
})();
//#endregion

//  声明一个变量targetDir，用于存储目标目录
let targetDir = null;
//  声明一个变量targetFile，用于存储目标文件
let targetFile = null;

// 获取命令行参数输入：对单个文件复制时使用
const args = process.argv.slice(2); // 去掉前两个参数（node路径和脚本路径）
targetFile = args[0];

// // dev-log >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
console.log(`[Dev_Log][${'targetFile'}_]_>>>`, targetFile);

// 模板文件夹路径（更新为 /src/components/TemplatePage）
const projectRoot = path.resolve(process.cwd());
const templateDir = path.resolve(projectRoot, 'src/components/TemplatePage');

// 复制文件夹函数
function copyTemplateFile(source, target) {
  // 检查目标文件夹是否存在，如果不存在退出
  if (!fs.existsSync(source)) return $log.error('模板文件不存在！');

  // 读取源文件夹中的所有文件和文件夹
  const files = fs.readdirSync(source);
  if (files.length === 0) return $log.error('模板文件夹为空！');

  // 检查单个复制时目标文件是否存在，如果不存在退出
  if (targetFile && !files.includes(targetFile))
    return $log.error(`模板文件名称参数非法，可创建模板文件名如下：[${files}]`);

  // 检查目标文件夹是否存在，如果不存在则创建
  if (!fs.existsSync(target)) {
    $log.info(`创建目标文件夹`);
    fs.mkdirSync(target, { recursive: true });
  } else {
    $log.warning(`已存在目标文件夹，将追加模板文件; 复制成功后请检查是否存在同名文件内容覆盖！`);
  }

  // 复制单个模板文件
  if (targetFile) {
    const sourcePath = path.join(source, targetFile);
    const targetPath = path.join(target, targetFile);
    fs.copyFileSync(sourcePath, targetPath);
  } else {
    // 复制模板文件夹
    files.forEach((file) => {
      const sourcePath = path.join(source, file);
      const targetPath = path.join(target, file);

      // 判断是文件还是文件夹
      if (fs.lstatSync(sourcePath).isDirectory()) {
        // 如果是文件夹，递归复制
        copyTemplateFile(sourcePath, targetPath);
      } else {
        // 如果是文件，直接复制
        fs.copyFileSync(sourcePath, targetPath);
      }
    });
  }

  $log.success(`模板文件已成功复制到目录：${targetDir}`);
}

// 执行复制操作
try {
  /** 输入值一定要是本机的绝对路径 */
  $log.warning('请输入目标文件夹绝对路径：');
  process.stdin.on('data', (chunk) => {
    try {
      // 删除尾部多余换行符&除空
      chunk = chunk.slice(0, -1);
      const chunkStr = chunk.toString().trim();

      if (!chunkStr) {
        $log.error('未输入目标文件夹路径');
        process.stdin.emit('end');
      }

      targetDir = chunkStr;

      copyTemplateFile(templateDir, targetDir);

      process.stdin.emit('end');
    } catch (error) {
      $log.error(error);
    }
  });
} catch (err) {
  $log.error('创建模板文件时出错：', err);
} finally {
  // 生成结束，退出流程
  process.stdin.on('end', () => process.exit(0));
}
