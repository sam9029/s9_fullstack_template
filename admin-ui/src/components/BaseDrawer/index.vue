<template>
  <el-drawer
    :class="rootClass"
    v-bind="$attrs"
    v-on="$listeners"
    :withHeader="false"
    :destroy-on-close="destroyOnClose"
    ref="ref"
  >
    <aside class="clear drawer-aside">
      <div class="base-nav close-nav theme-bg" @click.stop="doCloseDrawer">
        <i class="el-icon-close close_icon"></i>
      </div>
      <template v-if="$props.navs">
        <div
          v-for="nav in navs"
          :key="nav.name"
          @click="navChange(nav.name)"
          :isactive="nav.name == active ? 1 : 0"
          class="base-nav extra-nav"
        >
          <i class="nav-icon" :class="nav.icon"></i>
          <div class="icon-desc">{{ nav.label }}</div>
        </div>
      </template>
    </aside>
    <section class="drawer-content">
      <header class="clear drawer-header">
        <!-- slot默认内容的语法兼容 -->
        <slot v-if="$slots.header" name="header"></slot>
        <template v-else>
          <div class="default-header">
            {{ $props.title }}
          </div>
        </template>
      </header>
      <main class="drawer-main" :style="{ backgroundColor: backgroundColor }">
        <slot></slot>
      </main>
      <footer class="clear drawer-footer">
        <!-- slot默认内容的语法兼容 -->
        <slot v-if="$slots.footer" name="footer">
        </slot>
        <template v-else>
          <div class="default-footer">
            <el-button @click="doCloseDrawer">取消</el-button>
            <el-button type="primary" :loading="submitLoading" @click="$emit('submit')" v-if="$props.submitShow">
              确认
            </el-button>
          </div>
        </template>
      </footer>
    </section>
  </el-drawer>
</template>

<script>
  /**
   * @property {string} title 抽屉标题 也可以通过slot="header"自定义
   * @property {Object[]} navs 侧边tab栏 INavitem { name:string; label:string; icon: string }
   * @property {string|number} active 当前选择tab, 支持.sync修饰符
   * @property {boolean} showTop 是否不遮盖顶部导航栏
   * @property {boolean} submitLoading 确认按钮loading
   * @property {string} backgroundColor 背景色
   * @property 其余参数、事件透传
   */
  export default {
    // props: ['title', 'navs', 'active', 'showTop', 'submitLoading', 'backgroundColor'],
    // props: ['title', 'navs', 'active', 'showTop', 'submitLoading', 'backgroundColor', 'destroyOnClose'],
    props: {
      title: {},
      navs: {},
      active: {},
      showTop: {},
      submitLoading: {},
      backgroundColor: {},
      destroyOnClose: {
        type: Boolean,
        fefault: false,
      },
      // 是否展示确定按钮
      submitShow: {
        type: Boolean,
        default: true,
      },
    },
    computed: {
      rootClass() {
        if (!this.showTop) return '';
        return 'drawer-show-top';
      },
    },
    methods: {
      navChange(name) {
        this.$emit('update:active', name);
        this.$emit('nav-chenge', name);
      },
      doCloseDrawer() {
        this.$refs.ref.closeDrawer();
        // this.$emit('update:visible', false)
      },
    },
  };
</script>

<style lang="scss" scoped>
  ::v-deep .el-drawer {
    overflow: visible;
  }
  .clear {
    padding: 0;
    margin: 0;
  }
  .base-nav {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    &:hover {
      cursor: pointer;
    }
  }
  .close-nav {
    padding: 10px 0;
    background-color: #2d3e55;
  }
  .extra-nav {
    color: #333;
    padding: 8px 0;
    .nav-icon {
      font-size: 16px;
    }
    .icon-desc {
      width: 36px;
      text-align: center;
      font-size: 12px;
      font-weight: 400;
      line-height: 16px;
    }
    &[isactive='1'] {
      color: #fff;
      background-color: var(--theme-default);
    }
    &[isactive='0'] {
      &:hover {
        background-color: #eceff3;
      }
    }
  }
  .close_icon {
    color: #fff;
    font-size: 26px;
    transition: transform 0.3s;
    &:hover {
      transform: rotate(180deg);
    }
  }
  .drawer-aside {
    position: absolute;
    left: 0;
    top: 0;
    transform: translateX(-100%);
    min-width: 47px;
    height: 100%;
    z-index: 1;
    background-color: #fff;
    border-right: 1px solid #f0f0f0;
  }
  .drawer-content {
    display: flex;
    flex-direction: column;
    position: relative;
    height: 100%;
  }
  .drawer-header {
    display: block;
    border-bottom: 1px solid #e4e9ed;
  }
  ::v-deep .default-header {
    color: #000;
    font-weight: 400;
    padding: 0 24px;
    height: 45px;
    line-height: 45px;
  }
  .drawer-main {
    background: #f6f6f6;
    display: block;
    flex: 1;
    overflow: auto;
  }
  .drawer-footer {
    border-top: 1px solid #e4e9ed;
  }
  ::v-deep .default-footer {
    padding: 10px 24px;
    text-align: right;
  }
  .drawer-show-top {
    ::v-deep .el-drawer {
      top: 64px;
      height: unset;
    }
  }
</style>
