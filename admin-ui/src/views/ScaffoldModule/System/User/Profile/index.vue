<template>
  <div class="app-container">
    <el-row type="flex" :gutter="20">
      <el-col :span="7" :xs="24" class="card-container">
        <el-card class="box-card">
          <div slot="header" class="clearfix">
            <span>个人信息</span>
          </div>
          <div>
            <div class="text-center">
              <!-- <i>
                <img
                  id="user-img"
                  src=""
                  alt="用户头像"
                />
              </i> -->
              <!-- <el-avatar
                :size="100"
                :src="avatar"
                class="user-avatar"
                icon="el-icon-user-solid"
              /> -->
              <UserAvatar ref="avatar"></UserAvatar>
              <div>
                <el-button round size="mini" class="icon-button" @click="changeAvatar"
                  >修改头像</el-button
                >
              </div>
            </div>

            <ul class="list-group list-group-striped">
              <li class="list-group-item">
                <svg-icon icon-class="user" />用户名称
                <div class="pull-right">{{ user.userName || '--' }}</div>
              </li>
              <li class="list-group-item">
                <svg-icon icon-class="user" />用户ID
                <div class="pull-right">
                  <BaseCopy :name="user.accountId"></BaseCopy>
                </div>
              </li>
              <!-- <li class="list-group-item">
                <svg-icon icon-class="phone" />手机号码
                <div class="pull-right">{{ user.telephone || '--' }}</div>
              </li>
              <li class="list-group-item">
                <svg-icon icon-class="email" />用户邮箱
                <div class="pull-right">{{ user.email || '--' }}</div>
              </li> -->
              <li class="list-group-item">
                <svg-icon icon-class="tree" />所属部门
                <!-- handleRegion(user.region) }} / {{ -->
                <div v-if="user.dept" class="pull-right">
                  {{ deptName || '--' }}
                </div>
              </li>
              <li class="list-group-item">
                <svg-icon icon-class="peoples" />所属角色
                <div class="pull-right">{{ roleName || '--' }}</div>
              </li>
              <li class="list-group-item">
                <svg-icon icon-class="date" />创建日期
                <div class="pull-right">{{ user.createTime || '--' }}</div>
              </li>
            </ul>
          </div>
        </el-card>
      </el-col>
      <el-col :span="17" :xs="24" class="card-container">
        <el-card :body-style="{ padding: '0 20px 0 20px' }">
          <!-- <div slot="header" class="clearfix">
            <span>基本资料</span>
          </div> -->
          <el-tabs v-model="activeTab">
            <el-tab-pane label="基本资料" name="userinfo">
              <UserInfo :user="user" @change="getUser()" />
            </el-tab-pane>
            <el-tab-pane label="修改密码" name="resetPwd">
              <ResetPwd :user="user" :activeTab="activeTab" />
            </el-tab-pane>
            <!-- <el-tab-pane v-if="accountType != 3" label="银行信息" name="bankInfo">
              <BankInfo v-if="activeTab == 'bankInfo'" :user="user" />
            </el-tab-pane> -->
            <el-tab-pane
              v-if="accountType == 4 && user.creator_type == 'business'"
              label="完善资质信息"
              name="qualification"
            >
              <Qualification :user="user" />
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
  import { mapGetters } from 'vuex';
  // import store from "@/store";
  import UserAvatar from './userAvatar';
  import UserInfo from './userInfo';
  import ResetPwd from './resetPwd';
  import BankInfo from './bankInfo';
  import Qualification from './qualification';
  import { getInfo } from '@/api/login';
  import { isEmpty } from 'lodash';
  import { decrypt, encrypt } from '@/utils/auth';

  export default {
    name: 'Profile',
    components: {
      UserAvatar,
      UserInfo,
      ResetPwd,
      BankInfo,
      Qualification,
      BaseCopy: () => import('@/components/BaseCopy/index.vue'),
    },
    data() {
      return {
        user: {},
        roleGroup: {},
        postGroup: {},
        activeTab: 'userinfo',
      };
    },
    computed: {
      ...mapGetters(['avatar', 'accountType']),
      handleRegion() {
        return function (region) {
          return region.join('、');
        };
      },
      deptName() {
        let arr = null;
        if (!isEmpty(this.user)) {
          arr = this.user.dept.map((item) => item.dept_name);
        } else {
          arr = [];
        }
        return arr.length ? arr.join('、') : '--';
      },
      roleName() {
        let arr = null;
        if (!isEmpty(this.user)) {
          arr = this.user.role.map((item) => item.role_name);
        } else {
          arr = [];
        }
        return arr.length ? arr.join('、') : '--';
      },
    },
    watch: {
      user: {
        handler(val) {
          if (val.realname_status) {
            if (this.$route.query?.type == 'qualification' && val.realname_status != 'T') {
              this.activeTab = 'qualification';
            }
          }
        },
        // immediate: true,
      },
    },
    created() {
      this.getUser();
    },
    activated() {
      this.getUser();
    },
    methods: {
      getUser() {
        this.init();
      },
      changeAvatar() {
        this.$refs.avatar.editCropper();
      },
      init() {
        getInfo()
          .then((res) => {
            if (res && res.code === 0) {
              let user = res.data;
              /** 兼容 */
              user.userName = user.name;
              user.accountId = user.id;
              user.createTime = user.create_time;

              let { phone } = user;
              phone = decrypt(phone);

              this.$set(this, 'user', user);
              this.$set(this.user, 'phone', phone);
            } else {
              throw res;
            }
          })
          .catch((error) => {
            this.$notify.error(error?.message || error || '获取用户信息失败');
          });
      },
    },
  };
</script>
<style scoped lang="scss">
  #user-img {
    width: 120px;
    height: 120px;
    border-radius: 60px;
  }
  // .card-container {
  // height: 360px;
  ::v-deep .el-card {
    height: 100%;
  }
  // }
  .icon-button {
    font-size: 16px;
  }

  .svg-icon {
    margin-right: 3px;
  }
  .list-group-item {
    border-top: none;
  }
</style>
