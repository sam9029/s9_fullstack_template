/**
 * ORIGINAL_THEME 修改默认配色 需要修改文件有
 * element-variables.scss
 * index.html
 * src\views\system\company\index.vue reset(){}
 * 本文件
 */
const chalk = require('./theme.json'); // 保存elemnt-ui默认样式
export const ORIGINAL_THEME = '#1890ff'; // ::root 和 element-variables.scss 默认主题色
const ELEMENT_ORIGINAL_THEME = '#409EFF'; // element-ui默认主题色
const CHALK_STYLE_ID = 'chalk-style'; // 主题样式表标签id
let currTheme = ORIGINAL_THEME;

function isSameTheme(newTheme) {
  return newTheme.toLowerCase() == currTheme.toLowerCase();
}

function themeChangePromise(newTheme, forceUpdate = false) {
  return new Promise((resolve, reject) => {
    if (typeof newTheme !== 'string') reject();
    if (isSameTheme(newTheme) && !forceUpdate) resolve();

    const oldVal = currTheme;
    const newThemeCluster = getThemeCluster(newTheme.replace('#', ''));
    const originalCluster = getThemeCluster(oldVal.replace('#', ''));

    const elementCluster = getThemeCluster(ELEMENT_ORIGINAL_THEME.replace('#', ''));
    const newStyle = updateStyle(chalk, elementCluster, newThemeCluster);

    let styleTag = document.getElementById(CHALK_STYLE_ID);
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.setAttribute('id', CHALK_STYLE_ID);
      document.head.appendChild(styleTag);
    }
    styleTag.innerText = newStyle;

    // 修改style标签内样式
    const styles = [].slice.call(document.querySelectorAll('style')).filter((style) => {
      const text = style.innerText;
      return new RegExp(oldVal, 'i').test(text) && !/Chalk Variables/.test(text);
    });
    styles.forEach((style) => {
      const { innerText } = style;
      if (typeof innerText !== 'string') return;
      style.innerText = updateStyle(innerText, originalCluster, newThemeCluster);
    });
    currTheme = newTheme;
    resolve();
  });
}

function updateStyle(style, oldCluster, newCluster) {
  let newStyle = style;
  oldCluster.forEach((color, index) => {
    newStyle = newStyle.replace(new RegExp(color, 'ig'), newCluster[index]);
  });
  return newStyle;
}

function getThemeCluster(theme) {
  const tintColor = (color, tint) => {
    let red = parseInt(color.slice(0, 2), 16);
    let green = parseInt(color.slice(2, 4), 16);
    let blue = parseInt(color.slice(4, 6), 16);

    red += Math.round(tint * (255 - red));
    green += Math.round(tint * (255 - green));
    blue += Math.round(tint * (255 - blue));

    red = red.toString(16).padStart('2', '0');
    green = green.toString(16).padStart('2', '0');
    blue = blue.toString(16).padStart('2', '0');

    return `#${red}${green}${blue}`;
  };

  const shadeColor = (color, shade) => {
    let red = parseInt(color.slice(0, 2), 16);
    let green = parseInt(color.slice(2, 4), 16);
    let blue = parseInt(color.slice(4, 6), 16);

    red = Math.round((1 - shade) * red);
    green = Math.round((1 - shade) * green);
    blue = Math.round((1 - shade) * blue);

    red = red.toString(16).padStart('2', '0');
    green = green.toString(16).padStart('2', '0');
    blue = blue.toString(16).padStart('2', '0');

    return `#${red}${green}${blue}`;
  };

  const clusters = [];
  for (let i = 0; i <= 9; i++) {
    clusters.push(tintColor(theme, Number((i / 10).toFixed(2))));
  }
  for (let i = 1; i <= 5; i++) {
    clusters.push(shadeColor(theme, Number((i / 10).toFixed(2))));
  }
  return clusters;
}

export const changeThemeColor = themeChangePromise;
