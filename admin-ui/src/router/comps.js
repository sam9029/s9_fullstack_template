// 批量导入vue组件
const comps = {};
const context = require.context('../views', true, /\.vue/);
context.keys().forEach((key) => {
  // const fileName = key
  const reqCom = context(key);
  var com = reqCom.default || reqCom;
  // 通过组件name属性筛选。若通过路径方式，容易重叠。
  const name = com.name;
  if (name) {
    // 转换首字母为小写
    var _name = name[0].toLowerCase() + name.slice(1);
    comps[_name] = com;
  }
});
// console.log('comps',comps);
export default comps;

// 路径筛选方式
// var s = __file.split('\\')
// var name = s.pop().split('.vue')[0]
