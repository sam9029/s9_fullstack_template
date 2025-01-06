const fs = require('fs');

// process.chdir('../')

fs.readFile('node_modules\\element-ui\\lib\\theme-chalk\\index.css', { encoding: 'utf8' }, (err, data) => {
  if (err) {
    errorLog('get element ui css content error:');
    return console.log(err);
  }

  let str = data.replace(/@font-face{[^}]+}/, '');
  str = str.replace(/\.el-icon-[^{]+:before{[^}]+}/g, "");
  // 精简css 只保留颜色相关属性 需要安装 css
  // npm install --registry=https://registry.npmmirror.com css
  str = getSimpleCss(str);
  fs.writeFile('.\\src\\utils\\theme.json', JSON.stringify(str), { encoding: 'utf8' }, (err) => {
    if (err) {
      errorLog('write theme css json error:');
      return console.log(err);
    }
    successLog('\x1b[32m复制主题色文件成功！\x1b[0m')
  })
})

function getSimpleCss(cssStr) {
  const css = require('css');
  const obj = css.parse(cssStr);
  let str = `@charset "UTF-8";`;
  obj.stylesheet.rules.forEach(rule => {
    if (rule.type == 'rule') {
      let selectors = '';
      let declarations = [];
      selectors = rule.selectors.join(',');
      rule.declarations.forEach(declar => {
        if (checkColor(declar)) {
          declarations.push(`${declar.property}:${declar.value}`);
        }
      })
      if (selectors && declarations.length) {
        str += `${selectors}{${declarations.join(';')}}`
      }
    }
  })
  return str;
}

function checkColor(declar) {
  const { property, value } = declar;
  if (/color/.test(property)) return true;
  if (/#[0-9a-f]+/.test(value)) return true;
  if (/rgb/.test(value)) return true;
  if (/hsl/.test(value)) return true;
  if (/transparent/.test(value)) return true;
}

function successLog(txt) {
  console.log(`\x1b[32m${txt}\x1b[0m`)
}

function errorLog(txt) {
  console.log(`\x1b[31m${txt}\x1b[0m`)
}