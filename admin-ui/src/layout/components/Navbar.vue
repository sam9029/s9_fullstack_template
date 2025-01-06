<template>
  <div class="koc-navbar">
    <hamburger
      v-show="!topNav"
      id="hamburger-container"
      :is-active="sidebar.opened"
      class="hamburger-container"
      @toggleClick="toggleSideBar"
    />

    <breadcrumb v-if="!topNav" id="breadcrumb-container" class="breadcrumb-container" />
    <template v-else>
      <!-- logo -->
      <Logo></Logo>
    </template>
    <top-nav id="topmenu-container" class="topmenu-container" />
    <div class="right-menu">
      <template v-if="device !== 'mobile'">
        <!-- <el-tooltip content="全屏展示" effect="dark" placement="bottom">
          <screenfull id="screenfull" class="right-menu-item hover-effect" />
        </el-tooltip>
        <el-tooltip content="布局大小" effect="dark" placement="bottom">
          <size-select id="size-select" class="right-menu-item hover-effect" />
        </el-tooltip>-->
        <el-button
          type="primary"
          icon="el-icon-user"
          size="small"
          circle
          style="background-color: #ff4a59; margin-right: 8px; border-color: #ff4a59"
          v-if="sideTheme === 'white'"
        ></el-button>
        <svg-icon iconClass="right-menu-item hover-effect btn-mr" iconName="yonghu1" v-else></svg-icon>
      </template>

      <!-- <Message></Message> -->

      <el-dropdown class="avatar-container right-menu-item hover-effect" trigger="hover">
        <div class="avatar-wrapper">
          <el-avatar :size="30" :src="avatar" class="user-avatar" />
          <!-- <img :src="avatar" class="user-avatar"> -->
          <span class="right-menu-item hover-effect user">
            {{ $store.getters.name }}
          </span>
          <i class="el-icon-caret-bottom" />
        </div>
        <el-dropdown-menu slot="dropdown" class="tse">
          <router-link to="/user/profile">
            <el-dropdown-item>个人中心</el-dropdown-item>
          </router-link>
          <el-dropdown-item @click.native="share" v-if="isKoc">我的分享</el-dropdown-item>
          <!-- <el-dropdown-item @click.native="showImportDate = true" v-if="isSuperManger"
            >更新日期</el-dropdown-item
          > -->
          <el-dropdown-item @click.native="setting = true">
            <span>布局设置</span>
          </el-dropdown-item>
          <el-dropdown-item divided @click.native="logout">
            <span>退出登录</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import Breadcrumb from '@/components/Breadcrumb';
import TopNav from '@/components/TopNav';
import Hamburger from '@/components/Hamburger';
import Screenfull from '@/components/Screenfull';
import SizeSelect from '@/components/SizeSelect';
import ImportExcel from '@/components/Common/ImportExcel';
import { copyText } from '@/utils/common/tools';
// import { shareData } from '@/api/kocManagement/consultant';
import { updatePublishDate } from '@/api/public';
import { getUrlPath } from '@/utils/tools.js';
import { getUserData } from '@/utils/common/user';
import store from '@/store';
import Message from './message/list.vue';
let notify = null;
export default {
  data() {
    return {
      option_type: '',
      options: [
        {
          value: 'publish',
          label: '更新发布日期',
        },
        {
          value: 'verify',
          label: '更新审核日期',
        },
      ],
      tableCols: [
        {
          prop: 'keyword',
          label: '关键词',
        },
        {
          prop: 'platform_account_id',
          label: '博主平台账户ID',
        },
        {
          prop: 'opus_url',
          label: '作品链接',
          showOverflowTooltip: true,
          minWidth: 180,
        },
        {
          prop: 'publish_date',
          label: '发布日期',
        },
        {
          prop: 'reason',
          label: '错误原因',
          showOverflowTooltip: true,
          minWidth: 180,
        },
      ],
      showImportDate: false,
      shareData: {
        qr_link: '',
        account_avatar: '',
        account_id: '',
        account_uid: '',
        applet_link: '',
        applet_scheme: '',
        expire_date: '',
      },
      shareLoading: false,
      visible: false,
    };
  },
  mounted() {
    // store.dispatch('GetMessageCount');
  },
  components: {
    ImportExcel,
    Breadcrumb,
    TopNav,
    Hamburger,
    Screenfull,
    SizeSelect,
    Message,
    Logo: () => import('./Logo'),
    BaseDrawer: () => import('@/components/BaseDrawer'),
    VueQr: () => import('vue-qr'),
  },
  computed: {
    ...mapGetters(['sidebar', 'avatar', 'device']),
    setting: {
      get() {
        return this.$store.getters.effectSettings.showSettings;
      },
      set(val) {
        this.$store.dispatch('settings/changeSetting', {
          key: 'showSettings',
          type: 'user',
          value: val,
        });
      },
    },
    topNav: {
      get() {
        return this.$store.getters.effectSettings.topNav;
      },
    },
    sideTheme() {
      return this.$store.state.settings.effectSettings.sideTheme;
    },
    isKoc() {
      return (
        this.$store.getters.userInfo.isKocRole || this.$store.getters.userInfo.account_type == 2
      );
    },
    isSuperManger() {
      return this.$store.getters.userInfo.isSuperAccount;
    },
  },
  methods: {
    getUserData() {
      return getUserData();
    },
    getUrlPath(url) {
      return getUrlPath( url );
    },
    updatePublishDate(url) {
      return updatePublishDate({ url, option_type: this.option_type });
    },
    formatFail(data) {
      if (data.code == 0 && data.unmatch_data && data.unmatch_data.length) return data.unmatch_data;
      return null;
    },
    getShareData() {
      this.shareLoading = true;
      shareData({ account_id: this.$store.getters.currentAccountId })
        .then((res) => {
          if (res.code == 0) {
            this.shareData = res.data;
          }
        })
        .catch((err) => {
          if (notify) notify.close();
          notify = this.$notify.error({
            title: '错误',
            message: err.message || err || '未知异常！',
          });
        })
        .finally(() => {
          this.shareLoading = false;
        });
    },
    toggleSideBar() {
      this.$store.dispatch('app/toggleSideBar');
    },
    async logout() {
      this.$confirm('确定退出系统？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
        .then(() => {
          this.$store.dispatch('LogOut').then(() => {
            // location.href = this.getUrlPath(this.$store.getters.userInfo.creator_host) || '/login';
            // location.href = this.getUserData().creator_host || this.getUrlPath(this.$store.getters.userInfo.creator_host) || '/login';
            location.href = this.getUrlPath(this.getUserData().creator_host || this.$store.getters.userInfo.creator_host) || '/login';
          });
        })
        .catch((err) => {console.log(`err---:`,err);});
    },
    close() {
      this.visible = false;
    },
    share() {
      this.visible = true;
      this.getShareData();
    },
    copyShareContent(text) {
      const success = copyText(text);
      success && this.$notify.success('复制成功！');
    },
  },
};
</script>

<style lang="scss" scoped>
.koc-navbar {
  // min-width: 1280px;
  // height: 50px;
  height: 64px;
  // overflow: hidden;
  display: flex;
  position: relative;
  background: var(--kj-nav-background-color);
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);

  .hamburger-container {
    // line-height: 46px;
    line-height: 64px;
    height: 100%;
    // float: left;
    cursor: pointer;
    transition: background 0.3s;
    -webkit-tap-highlight-color: transparent;

    &:hover {
      background: rgba(0, 0, 0, 0.025);
    }
  }

  .breadcrumb-container {
    // float: left;
    flex: 1;
  }

  .topmenu-container {
    // float: left;
    // position: absolute;
    // left: 50px;
    border: none;
    margin-left: 15px;
    flex: 1;
    flex-wrap: nowrap;
    display: flex;
    align-items: center;
  }

  .errLog-container {
    display: inline-block;
    vertical-align: top;
  }

  .right-menu {
    display: table-cell;
    line-height: 64px;
    height: 100%;
    flex-shrink: 0;

    &:focus {
      outline: none;
    }

    .right-menu-item {
      display: inline-block;
      // padding: 0 2px;
      // font-size: 18px;
      color: var(--kj-nav-color);
      line-height: normal;
      vertical-align: middle;
      line-height: 30px;
      margin-bottom: 0 !important;

      &.hover-effect {
        cursor: pointer;
        transition: background 0.3s;

        &:hover {
          background: rgba(0, 0, 0, 0.025);
        }
      }
      .user {
        color: var(--kj-nav-color);
        font-size: 14px;
      }
    }

    .avatar-container {
      margin-right: 30px;
      display: inline-flex;

      .avatar-wrapper {
        display: inline-flex;
        position: relative;

        .user-avatar {
          cursor: pointer;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          margin-right: 10px;
        }

        .el-icon-caret-bottom {
          cursor: pointer;
          position: absolute;
          right: -20px;
          top: 20px;
          font-size: 12px;
          &::before {
            position: relative;
            bottom: 10px;
            color: var(--kj-nav-color);
          }
        }
      }
    }
  }
  .main-info {
    padding: 10px;
    .flex-box {
      margin-bottom: 10px;
    }
    .cursor {
      cursor: pointer;
    }
  }
}
.btn-mr {
  margin-right: 10px;
}
.icon-yonghu1 {
  color: var(--kj-nav-color);
  font-size: 23px;
}
::v-deep .el-input-group__append {
  color: var(--theme-dark1);
  background-color: var(--theme-light9);
  border: 1px solid var(--theme-default);
}
.icon-wenhao {
  font-weight: normal;
}
// .tse {
// z-index: 2005 !important;
// }
</style>
