<template>
  <div class="nav-container">
    <div
      class="nav"
      v-for="(item, index) in topMenus"
      :active="item.path.indexOf($route.path.split('/')[1]) !== -1"
      :key="index"
    >
      <a class="nav-name">
        <routerLink :to="JumpPath(item)">
          {{ item.meta.title }}
        </routerLink>
      </a>
      <div class="nav-dropdown" :style="`width:${WidthCal(item)}px`" v-if="showDropDown(item)">
        <div class="panel">
          <template v-for="(subitem, index2) in item.children">
            <div class="list-block" :key="'child' + index2" v-if="subitem">
              <div class="list-title">
                <span class="title">
                  <span class="shu">
                    <!-- <svg-icon icon-class=" " /> -->
                  </span>
                  {{ subitem.meta.title }}
                </span>
              </div>
              <ul class="list-ul" :class="{ huanhang: subitem.children.length > 5 }">
                <template v-for="(subitem2, index3) in subitem.children">
                  <li :key="'child' + index3" v-if="index3 < 4">
                    <routerLink :to="`${item.path}/${subitem.path}/${subitem2.path}`">
                      <span style="margin-left: 12px">
                        <svg-icon icon-class="" />
                      </span>
                      <span> {{ subitem2.meta.title }}</span>
                    </routerLink>
                  </li>
                </template>
              </ul>
              <ul
                class="list-ul"
                v-if="subitem.children.length > 5"
                :class="{ huanhang: subitem.children.length > 5 }"
              >
                <template v-for="(subitem2, index3) in subitem.children">
                  <li :key="'child' + index3" v-if="index3 >= 4">
                    <routerLink :to="`${item.path}/${subitem.path}/${subitem2.path}`">
                      <span style="margin-left: 12px">
                        <svg-icon icon-class="" />
                      </span>
                      <span> {{ subitem2.meta.title }}</span>
                    </routerLink>
                  </li>
                </template>
              </ul>
            </div>
          </template>
        </div>
      </div>

      <div class="nav-dropdown" v-if="item.path === '/capital'">
        <div class="panel">
          <div class="list-block">
            <div class="list-title">
              <span class="title">
                <span class="shu">
                  <!-- <svg-icon icon-class=" " /> -->
                </span>
                基础创意
              </span>
            </div>
            <ul class="list-ul" :class="{ huanhang: item.children.length > 5 }">
              <template v-for="(subitem, index2) in item.children">
                <li :key="'child' + index2" v-if="index2 < 4">
                  <routerLink :to="capitalRouter(item, subitem)">
                    <span style="margin-left: 12px">
                      <svg-icon icon-class="" />
                    </span>
                    <span> {{ subitem.meta.title }}</span>
                  </routerLink>
                </li>
              </template>
            </ul>
            <!-- <ul class="list-ul" :class="{ huanhang: item.children.length > 5 }">
              <template v-for="(subitem2, index3) in subitem.children">
                <li :key="'child' + index3" v-if="index3 >= 4">
                  <routerLink
                    :to="`${item.path}/${subitem.path}/${subitem2.path}`"
                  >
                    <span style="margin-left: 12px">
                      <svg-icon icon-class=" " />
                    </span>
                    <span> {{ subitem2.meta.title }}</span>
                  </routerLink>
                </li>
              </template>
            </ul> -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    data() {
      return {};
    },
    computed: {
      // 顶部显示菜单
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
        //要注释掉
        // newTopMenus.unshift({
        //   path: "/index",
        //   meta: { icon: "dashboard", title: "首页" }
        // });
        return newTopMenus;
      },
      showDropDown() {
        return function (item) {
          return item.children && !['/capital', '/system', '/home'].includes(item.path);
        };
      },
    },
    methods: {
      /**
       * 筛选合适的数据
       */
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
        return path;
      },

      /**
       * 计算下拉面板宽度
       */
      WidthCal(item) {
        let length = item.children && item.children.length;
        return length * 150;
      },
      capitalRouter(item, subitem) {
        let path = `${item.path}/${subitem.path}`;
        if (subitem.children && subitem.children.length) path += '/' + subitem.children[0].path;
        return path;
      },
    },
  };
</script>

<style lang="scss" scoped>
  @import '@/layout/index.scss';
  .nav-container {
    height: 100%;
    margin-left: 30px;
    vertical-align: top;
    flex: 1;

    .nav {
      display: inline-block;
      text-align: center;
      font-size: 15px;
      height: 100%;
      line-height: 64px;
      font-weight: 500;
      position: relative;
      transition: all 1s ease;
    }
    .nav[active='true'] > a,
    .nav:hover > a,
    .nav.nav-dropdown-hover > a {
      color: var(--kj-nav-selected-color);
    }
    .nav[active='true'] > a:after {
      content: '';
      display: inline-block;
      width: 24px;
      height: 4px;
      background-color: var(--kj-nav-active-bottom-color);
      border-radius: 2px;
      position: absolute;
      bottom: 13px;
      left: 50%;
      transform: translateX(-50%);
    }

    .nav:hover .nav-dropdown {
      visibility: visible;
    }

    .nav-name {
      cursor: pointer;
      color: var(--kj-nav-color);
      user-select: none;
      text-decoration: none !important;
      display: inline-block;
      padding: 0px 20px;
    }

    .nav-dropdown {
      display: inline-block;
      visibility: hidden;
      position: absolute;
      top: 64px;
      background: #fff;
      left: -36px;
      background: #fff;
      box-shadow: rgb(24 26 27 / 8%) 0px 2px 6px;
      flex-direction: column;
      // overflow: auto;
      z-index: 2001;

      .panel {
        display: block;
        // min-height: 196px;
        // max-height: 614px;
        // padding: 24px 32px;
        padding: 0;
        padding-bottom: 16px;
        justify-content: space-between;
      }
      .list-block {
        display: inline-block;
        text-align: left;
        width: 150px;
        vertical-align: top;

        .list-title {
          font-size: 0;
          height: 48px;
          line-height: 22px;
          background-color: var(--kj-side-selected-background-color);
          cursor: default;
          span {
            font-size: 14px;
            color: #333;
            font-weight: 600;
            margin-left: 8px;
          }

          .title {
            display: inline-block;
            margin-left: 10px;
            margin-top: 12px;
            .shu {
              content: ' ';
              display: inline-block;
              width: 4px;
              margin-right: 3px;
              height: 18px;
              background-color: var(--kj-side-selected-color);
              border-radius: 2px;
              -webkit-transform: translateY(21%);
              transform: translateY(21%);
            }
          }
        }
      }

      .list-ul {
        padding: 0;
        list-style: none;
        li {
          display: block !important;
          margin-top: 14px;
          height: 14px;
          line-height: 14px;
          a {
            font-size: 14px;
            width: 100%;
            height: 100%;
            color: #333;
            text-decoration: none !important;
            display: inline-block;
            position: relative;
            background-color: transparent;
          }
          a:hover {
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
</style>
