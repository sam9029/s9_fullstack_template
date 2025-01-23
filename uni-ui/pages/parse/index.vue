<template>
  <view class="base-parse u-p-28 u-vh-100">
    <u-loading-icon :show="loading"></u-loading-icon>
    <u-parse :content="currentParse" :selectable="true"></u-parse>
    <base-toast ref="toastRef"></base-toast>
  </view>
</template>

<script>
import { getParseContent, getMessageUrl } from "@/api/public.js";
export default {
  data() {
    return {
      type: "DEFAULT",
      title: "欢乐创",
      currentParse: "",
      loading: false,
    };
  },
  onLoad({ id, type, title }) {
    this.loading = true;
    this.type = type;
    this.queryParseContent(id);
    if (type == "COURSE") this.title = "图文教程";
    if (type == "MESSAGE") this.title = title;
    uni.setNavigationBarTitle({
      title: this.title,
    });
  },
  methods: {
    // 获取富文本信息
    async queryParseContent(id) {
      try {
        let func;
        let params;
        switch(this.type) {
          case 'DEFAULT':
          func = getParseContent;
          params = {
            banner_id: id,
          };
          break;
          case 'MESSAGE':
          func = getMessageUrl;
          params = {
            message_id: id,
          };
          break;
          // case 'COURSE':
          // func = getCourseWatch;
          // params = {
          //   id,
          // };
          // break;
        } 
        const res = await func(params);
        if (res.code === 0) {
          if (this.type == "DEFAULT") {
            this.currentParse = res.data.content;
          } else if (this.type == "MESSAGE") {
            this.currentParse = res.data.content;
          } else {
            this.currentParse = res.data.describe;
          }
        }
        this.loading = false;
      } catch (error) {
        this.loading = false;
        this.toastMsg(error.message || error, 'error');
      }
    },

    toastMsg(message, type = "default", duration = 2000) {
      this.$refs.toastRef?.show({
        type,
        message,
        duration
      });
    },
  },
};
</script>

<style lang="scss" scoped>
</style>
