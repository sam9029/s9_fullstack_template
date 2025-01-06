import loadMore from './selectLoadMore';
import drag from './drag';

const install = function (Vue) {
  Vue.directive('el-select-loadmore', loadMore);
  Vue.directive('drag', drag);
  Vue.directive('auth', {
    inserted: (el, obj) => {
      console.error('v-auth is deprecated! ' + `value: ${obj.value}`);
    },
  });
};

export default install;
