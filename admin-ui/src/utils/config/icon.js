/**
 * ***此ICON_LIST以供IconSelect使用***
 * - 所有ICON使用iconfont，CDN链接查看index.html
 * - （非必须）可以在此ICON_LIST追加icon名称 以供IconSelect使用
 * - IconSelect 主要用于菜单创建时的图标选取
 */

export let ICON_LIST = [];

// /** 自动读取icon网络JS文件生成本地ICON_LIST名称 */
(() => {
  const ICONFONT_URL = process.env.VUE_APP_ICONFONT_URL;
  if (ICONFONT_URL) {
    fetch(ICONFONT_URL)
      .then((response) => {
        // 确保响应是成功的
        if (!response.ok) {
          throw new Error('Network response was not ok ' + response.statusText);
        }
        // 读取响应体为文本
        return response.text();
      })
      .then((scriptText) => {
        // 使用正则表达式匹配所有的symbol标签中的id属性
        const symbolIdRegex = /<symbol\s+id="([^"]+)"/g;
        let match;

        // 循环匹配所有symbol标签的id
        while ((match = symbolIdRegex.exec(scriptText)) !== null) {
          // match[1]是第一个捕获组，即id的值
          let iconName = match[1].split('icon-')[1];
          ICON_LIST.push(iconName);
        }
      })
      .catch((error) => {
        // 处理任何发生的错误
        console.error('Failed to fetch remote icon-font script file:', error);
      });
  }
})();
