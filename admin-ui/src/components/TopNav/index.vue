<template>
  <div class="nav-container">
    <template v-for="(item, index) in topMenus">
      <div
        class="nav"
        v-if="getRouterDeepLength(item) > 1"
        :active="item.path.indexOf($route.path.split('/')[1]) !== -1"
        :key="index"
      >
        <el-popover
          placement="bottom-start"
          :width="WidthCal(item)"
          trigger="hover"
          :open-delay="200"
          :close-delay="200"
          :visible-arrow="false"
          popper-class="no-padding"
        >
          <div class="panel" v-if="showDropDown(item) && getRouterDeepLength(item) == 3">
            <template v-for="(subitem, index2) in item.children">
              <div
                :key="'child' + index2"
                :style="blockWidthCal(subitem)"
                class="list-block"
                v-if="subitem.children.length > 0"
              >
                <div class="list-title">{{ subitem.meta.title }}</div>
                <div class="list-ul" :class="liWidthCal(subitem)">
                  <div
                    v-for="(subitem2, index3) in subitem.children"
                    :key="'child' + index3"
                    :class="getItemClass(`${item.path}/${subitem.path}/${subitem2.path}`)"
                  >
                    <routerLink :to="newCapitalRouter(item, subitem, subitem2)">
                      {{ subitem2.meta.title }}
                    </routerLink>
                  </div>
                </div>
              </div>

              <div :key="'child' + index2" class="list-block" v-if="subitem.children.length <= 0">
                <div class="list-title">{{ subitem.meta.title }}</div>
                <div class="list-ul" :class="liWidthCal(item)">
                  <div :class="getItemClass(`${item.path}/${item.children[index2].path}`)">
                    <routerLink :to="capitalRouter(item, item.children[index2])">
                      {{ subitem.meta.title }}
                    </routerLink>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <div class="panel" v-if="showDropDown(item) && getRouterDeepLength(item) == 2">
            <div class="list-block" :style="blockWidthCal(item)">
              <div class="list-title">{{ item.meta.title }}</div>
              <div class="list-ul" :class="liWidthCal(item)">
                <div
                  v-for="(subitem, index2) in item.children"
                  :key="index2"
                  :class="getItemClass(`${item.path}/${subitem.path}`)"
                >
                  <routerLink :to="capitalRouter(item, subitem)">
                    {{ subitem.meta.title }}
                  </routerLink>
                </div>
              </div>
            </div>
          </div>
          <template slot="reference">
            <routerLink class="nav-name" :to="JumpPath(item)">{{ item.meta.title }}</routerLink>
          </template>
        </el-popover>
      </div>
    </template>
  </div>
</template>

<script>
  import { cloneDeep } from 'lodash';
  const LEN = 6;
  // const LEN = 9;
  export default {
    data() {
      return {};
    },
    computed: {
      // 顶部显示菜单
      activeRouter() {
        return this.$route.path;
      },
      topMenus() {
        let topMenus = [];
        let routers = this.$store.state.permission.topbarRouters;
        routers.map((menu) => {
          if (menu.hidden !== true) {
            // 兼容顶部栏一级菜单内部跳转
            if (menu.path === '/') {
              topMenus.push(menu.children[0]);
            } else {
              topMenus.push(menu);
            }
          }
        });

        let newTopMenus = [];

        newTopMenus = this.DataPro(topMenus);

        return newTopMenus;
      },
    },
    methods: {
      /**
       * 筛选合适的数据
       */
      getItemClass(path) {
        let classNames = ['li'];
        if (path && path == this.activeRouter) classNames.push('active-item');
        return classNames;
      },
      getRouterDeepLength(item) {
        let deep = 1;
        if (item && item.children && item.children.length) {
          deep = 2;
          item.children.forEach((element) => {
            if (element && element.children && element.children.length) deep = 3;
          });
        }
        return deep;
      },
      showDropDown(item) {
        return item.children && !['/home'].includes(item.path);
      },
      DataPro(nodes) {
        if (!(nodes && nodes.length)) {
          return [];
        }
        const newChildren = [];
        for (const node of nodes) {
          if (node.hidden === false && node.meta.hasPermission) {
            newChildren.push(node);
            node.children = this.DataPro(node.children);
          }
        }
        return newChildren;
      },
      /**
       * 处理跳转路径
       */
      JumpPath(item) {
        let path = item.path;
        if (item.children && item.children.length) {
          path += '/' + item.children[0].path;
        }
        if (item.children && item.children[0].children && item.children[0].children.length) {
          path += '/' + item.children[0].children[0].path;
        }
        if (
          item.children &&
          item.children[0].children &&
          item.children[0].children.length &&
          item.children[0].children[0].children &&
          item.children[0].children[0].children.length
        ) {
          path += '/' + item.children[0].children[0].children[0].path;
        }
        return path;
      },

      /**
       * 计算下拉面板宽度
       */
      WidthCal(item) {
        let deep = this.getRouterDeepLength(item);
        if (deep == 1) return 0;
        if (deep == 2) {
          // 有子菜单时 动态返回 150的倍数宽度
          if (item.children && item.children.length) {
            return 150 * Math.ceil(item.children.length / LEN);
          }
          return 150;
        }
        // if (deep == 3) {
        //   let len = 0;
        //   item.children.forEach((item) => {
        //     len += Math.ceil(item.children.length / 4);
        //   });
        //   return 150 * len;
        // }
        // if (deep == 3) return 150 * Math.ceil(item.children.length / 4);
        //不设置宽度，使其自动撑开
      },
      capitalRouter(item, subitem) {
        let path = `${item.path}/${subitem.path}`;
        if (subitem.children && subitem.children.length) path += '/' + subitem.children[0].path;
        return path;
      },
      /**
       * 针对第三级菜单跳转的补丁路由跳转
       * @param {*} item
       * @param {*} subitem
       */
      newCapitalRouter(item, subitem, subitem2) {
        let path = `${item.path}/${subitem.path}/${subitem2.path}`;
        if (subitem2.children && subitem2.children.length) {
          path = `${item.path}/${subitem.path}/${subitem2.path}/${subitem2.children[0].path}`;
        }
        return path;
      },
      liWidthCal(item) {
        let len = Math.ceil(item.children.length / LEN);
        len = Math.min(len, 4);
        return 'hal_col_' + len;
      },
      blockWidthCal(item) {
        let len = Math.ceil(item.children.length / LEN);
        let width = Math.min(len * 150, 600);
        let obj = { width: width + 'px' };
        if (width >= 600) obj.display = 'block';
        return obj;
      },
    },
  };
</script>

<style lang="scss" scoped>
  $navHeight: 64px;
  $tagHeight: 34px;
  .nav-container {
    height: $navHeight;
    line-height: $navHeight;
  }
  .nav {
    font-size: 15px;
    font-weight: 500;
    position: relative;
    .nav-name {
      color: var(--kj-nav-color);
      cursor: pointer;
      padding: 0px 20px 13px;

      &:hover {
        color: var(--kj-nav-selected-color);
      }
    }

    &[active='true'] .nav-name {
      color: var(--kj-nav-selected-color);
      &:after {
        content: ' ';
        display: inline-block;
        width: calc(100% - 40px);
        height: 4px;
        background-color: var(--kj-nav-active-bottom-color);
        border-radius: 2px;
        position: absolute;
        bottom: 13px;
        left: 50%;
        transform: translateX(-50%);
      }
    }
  }

  .panel {
    padding-bottom: 16px;
    // white-space: nowrap;
    overflow: hidden;
    max-width: 600px;

    .list-block {
      display: inline-block;
      width: 150px;
      vertical-align: top;
      overflow-x: hidden;
      margin-bottom: 10px;

      .list-title {
        background-color: var(--kj-side-selected-background-color);
        cursor: default;
        height: 48px;
        line-height: 48px;
        font-size: 14px;
        color: #333;
        font-weight: 600;
        padding-left: 24px;

        &:before {
          content: ' ';
          display: inline-block;
          width: 4px;
          margin-right: 8px;
          height: 16px;
          background-color: var(--kj-side-selected-color);
          border-radius: 2px;
          transform: translateY(21%);
        }
      }

      .list-ul {
        white-space: normal;
        // width: 110px;
        padding: 0 0 0 36px;
        .li {
          display: inline-block;
          min-width: 100%;
          padding-top: 4px;
          a {
            font-size: 14px;
            color: #333;
          }
          a:hover {
            color: var(--kj-side-selected-color);
          }
        }
        .active-item {
          a {
            color: var(--kj-side-selected-color);
          }
        }
      }
    }
  }

  .huanhang {
    display: inline-block !important;
    vertical-align: top;
  }
  .no-padding {
    padding: 0;
  }

  .hal_col_1 .li {
    min-width: 100% !important;
  }
  .hal_col_2 .li {
    min-width: 50% !important;
  }
  .hal_col_3 .li {
    min-width: 33.33% !important;
  }
  .hal_col_4 .li {
    min-width: 25% !important;
  }
</style>
