<template>
  <div :class="{ hideSidebar: isCollapse }" style="height: 100%">
    <div class="newsidebar-container">
      <el-menu
        :collapse-transition="false"
        :collapse="isCollapse"
        :default-active="activeMenu"
        :unique-opened="true"
        active-text-color="var(--theme-default)"
        background-color="var(--kj-side-all-background-color)"
        class="newsidebar-title scrollbar-wrapper"
        mode="vertical"
        text-color="var(--kj-side-color)"
      >
        <template v-for="route in Menu">
          <!-- 一级菜单-无子菜单 -->
          <el-menu-item
            v-if="route.children && route.children.length === 0"
            :index="`${baseRouter()}/${route.path}`"
            :key="`${baseRouter()}/${route.path}`"
            @click="jump(`/${baseRouter()}/${route.path}`)"
            :class="{ 'title-is-active-color': zaima(route) }"
          >
            <svg-icon :iconName="route.meta.icon || ''" style="font-size: 16px" />
            <span style="font-weight: 600">
              {{ route.meta.title }}
            </span>
          </el-menu-item>
          <!-- 一级菜单-含子菜单 -->
          <el-submenu
            v-else
            :index="`${baseRouter()}/${route.path}`"
            :key="`${baseRouter()}/${route.path}`"
          >
            <!-- 一级菜单 title -->
            <template slot="title">
              <svg-icon
                :icon-class="route.meta.icon || ''"
                style="font-size: 16px"
                :class="{ 'title-is-active-color': zaima(route) }"
              />
              <span :class="{ 'title-is-active-color': zaima(route) }" style="font-weight: 600">
                {{ route.meta.title }}
              </span>
            </template>
            <!-- 二级菜单 -->
            <template v-for="route2 in route.children">
              <!-- 二级菜单 不含子菜单 -->
              <el-menu-item
                v-if="route2.children && route2.children.length === 0"
                :index="`${baseRouter()}/${route.path}/${route2.path}`"
                :key="`${baseRouter()}/${route.path}/${route2.path}`"
                @click="jump(`/${baseRouter()}/${route.path}/${route2.path}`)"
              >
                <svg-icon :iconName="route2.meta.icon || ''" style="margin-right: 5px;"/>
                <span> {{ route2.meta.title }}</span>
              </el-menu-item>

              <!-- 二级菜单 含子菜单 -->
              <el-submenu
                v-else
                :index="`${baseRouter()}/${route2.path}`"
                :key="`${baseRouter()}/${route2.path}`"
                class="thirdly-menu"
                popper-class="thirdly-menu-popper"
              >
                <!-- 二级菜单子项 即 三级菜单-title -->
                <template slot="title">
                  <svg-icon
                    :icon-class="route2.meta.icon || ''"
                    style="font-size: 16px"
                    :class="{ 'title-is-active-color': zaima(route2) }"
                  />
                  <span
                    :class="{ 'title-is-active-color': zaima(route2) }"
                    style="font-weight: 600"
                  >
                    {{ route2.meta.title }}
                  </span>
                </template>
                <!-- 三级菜单 -->
                <el-menu-item
                  v-for="route3 in route2.children"
                  :index="`${baseRouter()}/${route.path}/${route2.path}/${route3.path}`"
                  :key="`${baseRouter()}/${route.path}/${route2.path}/${route3.path}`"
                  @click="jump(`/${baseRouter()}/${route.path}/${route2.path}/${route3.path}`)"
                >
                  <span> {{ route3.meta.title }}</span>
                </el-menu-item>
              </el-submenu>
            </template>
          </el-submenu>
        </template>
      </el-menu>
      <div
        style="
          border-top: 1px solid #dadfe3;
          display: flex;
          justify-content: flex-end;
          position: absolute;
          width: 100%;
        "
      >
        <hamburger
          id="hamburger-container"
          :is-active="sidebar.opened"
          class="hamburger-container"
          @toggleClick="toggleSideBar"
        />
      </div>
    </div>
  </div>
</template>

<script>
  import { mapGetters, mapMutations, mapState } from 'vuex';
  import Logo from './Logo';
  import SidebarItem from './SidebarItem';
  import variables from '@/assets/styles/variables.scss';
  import Hamburger from '@/components/Hamburger';

  export default {
    components: { SidebarItem, Logo, Hamburger },
    computed: {
      ...mapState(['settings']),
      ...mapGetters(['sidebarRouters', 'sidebar']),
      activeMenu() {
        const route = this.$route;
        let { meta, path } = route;
        if (meta.activeMenu) {
          return meta.activeMenu;
        }
        let arr = path.split('/');

        if (arr.length == 5) {
          return arr.slice(1, 5).join('/');
        }
        // console.log(arr.length);
        return arr.slice(1, 4).join('/');
      },
      Menu() {
        let menu = [];
        const { path } = this.$route;
        this.sidebarRouters.forEach((item) => {
          if (item.path !== '' && path.indexOf(item.path) !== -1) {
            menu = item.children;
          }
        });
        return menu;
      },
      variables() {
        return variables;
      },
      isCollapse() {
        return !this.sidebar.opened;
      },
    },
    methods: {
      toggleSideBar() {
        this.$store.dispatch('app/toggleSideBar');
      },
      zaima(data) {
        const { path } = this.$route;
        return path.split('/')[2] === data.path ? true : false;
      },
      baseRouter() {
        const route = this.$route;
        let { path } = route;
        return path.split('/')[1];
      },
      jump(r) {
        if (r === this.$route.path) return;
        this.$router.push({ path: r });
      },
      deal(nodes) {
        if (!(nodes && nodes.length)) {
          return [];
        }
        const newChildren = [];
        for (const node of nodes) {
          if (node.hidden === false && node.meta.hasPermission) {
            newChildren.push(node);
            node.children = this.deal(node.children);
          }
        }
        return newChildren;
      },
    },
  };
</script>

<style lang="scss" scoped>
  $navHeight: 64px;
  $tagHeight: 34px;

  .newsidebar-container {
    background: var(--kj-side-all-background-color);
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgb(0 0 0 / 10%);
    color: var(--kj-side-color);
    font-family: PingFangSC-Regular, tahoma, arial, 'Hiragino Sans GB', 'Microsoft yahei',
      sans-serif;
    font-size: 14px;
    font-weight: 400;
    height: 100%;
    transition: width 0.28s;
    width: 180px;
    overflow: hidden;
    .scrollbar-wrapper {
      overflow-x: hidden !important;
      overflow-y: scroll !important;
      height: calc(100% - 65px);
    }

    .is-horizontal {
      display: none;
    }

    a {
      display: inline-block;
      width: 100%;
      overflow: hidden;
    }

    .svg-icon {
      margin-right: 12px;
    }

    .el-menu-item,
    .el-submenu__title {
      overflow: hidden !important;
      // text-overflow: ellipsis !important;
      text-overflow: clip !important;
      white-space: nowrap !important;
    }

    .hamburger-container {
      cursor: pointer;
      height: 100%;
      line-height: 64px;
      transition: background 0.3s;

      &:hover {
        background: rgba(0, 0, 0, 0.025);
      }
    }
  }

  .hideSidebar {
    .newsidebar-container {
      width: 54px !important;
      -webkit-transition: width 0.28s;
      transition: width 0.28s;
    }

    .main-container {
      margin-left: 54px;
    }
    .submenu-title-noDropdown {
      padding: 0 !important;
      position: relative;

      .el-tooltip {
        padding: 0 !important;

        .svg-icon {
          margin-left: 20px;
        }
      }
    }

    .el-submenu {
      overflow: hidden;

      & > .el-submenu__title {
        padding: 0 !important;

        .svg-icon {
          margin-left: 20px;
        }
      }
    }

    .el-menu--collapse {
      .el-submenu {
        & > .el-submenu__title {
          & > span {
            height: 0;
            width: 0;
            overflow: hidden;
            visibility: hidden;
            display: inline-block;
          }
        }
      }
    }
  }

  ::v-deep .el-menu--popup {
    min-width: 110px !important;
  }
  .newsidebar-title .el-submenu .el-menu .is-active {
    background-color: var(--kj-side-selected-background-color) !important;
  }
  .newsidebar-title .el-submenu .el-menu .is-active:after {
    content: '';
    display: inline-block;
    height: 50px;
    border-left: 5px solid;
    position: absolute;
    left: 0%;
  }
  // 消除 三级菜单选中时的父级 is—active 产生黑条的bug
  .newsidebar-title .el-submenu .thirdly-menu.el-submenu.is-active::after {
    display: none !important;
  }
  .title-is-active-color {
    color: var(--theme-default) !important;
  }
  .el-menu-item:hover {
    color: var(--theme-light2) !important;
  }

  .el-submenu__title:hover,
  .el-menu-item:hover {
    background-color: var(--kj-side-all-background-color) !important;
  }

  // .newsidebar-title .el-submenu .el-menu-item:hover {
  //   color: var(--theme-light2);
  // }
  ::v-deep .newsidebar-title .el-submenu .el-submenu__title:hover {
    color: var(--theme-light2) !important;
    background-color: var(--kj-side-all-background-color) !important;
  }

  ::v-deep .el-menu--collapse {
    .is-active {
      background-color: var(--kj-side-selected-background-color) !important;
      .el-submenu__title {
        background-color: var(--kj-side-selected-background-color) !important;
      }
    }
  }
  ::v-deep .el-submenu .el-menu-item {
    min-width: 0;
    padding-left: 56px !important;
  }
  ::v-deep .el-menu {
    border: 0;
  }

  // 三级菜单样式
  .thirdly-menu {
    ::v-deep {
      .el-submenu__title {
        padding-left: 24px !important;

        svg {
          margin-left: 10px;
          margin-right: 2px;
        }
      }
      .el-menu-item {
        padding-left: 65px !important;
      }
    }
  }
  .thirdly-menu-popper {
    background: #999;
  }
</style>

<style lang="scss">
  // 解决 侧边菜单折叠时 财务-财务结算-变现佣金&会员佣金 子菜单弹出定位的问题
  .el-menu--vertical{
    .el-menu--popup{
      position: unset !important;
    }
  }
</style>
