<template> </template>

<script>
import { getInfo } from '@/api/login';

export default {
  data() {
    return {
      user: {},
    };
  },
  methods: {
    /**
     * @param {*} _hasCancel 是否拥有取消按钮
     */
    async open(_hasCancel = true, module) {
      await this.getUser();
      return new Promise((resolve, reject) => {
        // 版权方/经纪人/承制方 验证
        if (this.user.account_type == 1 || this.user.account_type == 4) {
          // 小果繁星老用户兼容，没有creator_type也需要弹窗
          if (this.user.account_type == 1 && !this.user.creator_type) {
            reject(false);
            this.handlePersonAuthorizeConfirm(_hasCancel);
            return
          }
          switch (this.user.creator_type) {
            case 'personal':
              if (this.user.realname_status != 'T') {
                reject(false);
                this.handlePersonAuthorizeConfirm(_hasCancel);
              } else {
                resolve(true);
              }
              break;
            case 'business':
              if ((this.user.realname_status == 'W' && !this.user.business_license_photo) || this.user.realname_status == 'F') {
                reject(false);
                this.handleMCNAuthorizeConfirm(_hasCancel);
                return
              }
              if(this.user.realname_status == 'W' && this.user.business_license_photo){
                reject(false);
                this.handleWaitVerifiedPrompt(_hasCancel, module);
              }
              if(this.user.realname_status == 'T') resolve(true);
              break;
            default:
              resolve(true);
          }
        }
        // 管理员直接通过
        else {
          resolve(true);
        }
      });
    },

    // 个人认证
    handlePersonAuthorizeConfirm(_hasCancel = true) {
      this.$confirm('请前往小果繁星app完成个人实名认证。', '提示', {
        confirmButtonText: '确认',
        // showClose: _hasCancel,
        showCancelButton: _hasCancel,
        closeOnClickModal: _hasCancel,
      })
        .then(() => { })
        .catch(() => { });
    },

    // 企业认证
    handleMCNAuthorizeConfirm(_hasCancel = true) {
      this.$confirm('请先完善企业资质信息。', '提示', {
        confirmButtonText: '前往完善',
        // showClose: _hasCancel,
        showCancelButton: _hasCancel,
        closeOnClickModal: _hasCancel,
      })
        .then(() => {
          this.$router.push({
            name: 'Profile',
            query: {
              type: 'qualification',
            },
          });
        })
        .catch(() => { });
    },
    // 待审核提示
    handleWaitVerifiedPrompt(_hasCancel = true ,module = '创作') {
      this.$confirm(`您的企业资质还在审核中，请耐心等待。\n资质审核通过后才能进行${module}。`, '提示', {
        confirmButtonText: '确认',
        // showClose: _hasCancel,
        showCancelButton: false,
        closeOnClickModal: true,
      })
        .then(() => { })
        .catch(() => { });
    },
    changeAvatar() {
      this.$refs.avatar.editCropper();
    },
    async getUser() {
      await getInfo()
        .then(({ data }) => {
          this.$set(this, 'user', data);
        })
        .catch((error) => {
          console.log(error);
          // reject(error);
        });
    },
  },
};
</script>
