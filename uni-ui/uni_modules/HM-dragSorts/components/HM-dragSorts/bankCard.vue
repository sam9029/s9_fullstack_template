<template>
  <view
    @click.stop="$emit('jump', data)"
    class="u-flex u-col-center u-p-20 u-p-l-30 u-p-r-30"
    :class="{ 'u-row-between': !noicon, 'bank-card': border }"
  >
    <u-image
      shape="square"
      radius="5px"
      :width="size"
      :height="size"
      :src="data.icon"
      lazy-load
    ></u-image>
    <view
      :class="{ 'u-m-l-60': noicon }"
      class="u-flex-col u-row-center banck-content-view"
    >
      <view v-if="!sort" class="u-flex u-col-center u-font-24 mini-tag">
        <text style="width: 200rpx">开户名：{{ people_name }}</text>
        <u-tag
          :text="verify_info.text"
          size="mini"
          shape="circle"
          :type="verify_info.type"
          :icon="verify_info.icon"
        ></u-tag>
      </view>
      <text class="u-m-t-4 u-font-24">{{ card_info }}</text>
      <view
        v-if="tags.length > 0"
        class="u-m-t-8 u-flex u-row-left u-col-center"
      >
        <view
          v-for="(tag, index) in tags"
          class="u-m-r-20 mini-tag"
          :key="index"
        >
          <u-tag :text="tag" size="mini" shape="circle" type="primary"></u-tag>
        </view>
      </view>
    </view>
    <u-icon v-if="!noicon" :name="icon" color="#909399" size="16"></u-icon>
  </view>
</template>

<script>
import { BANK_VERIFY_MAPPER, BANK_CERTIFICATE_MAPPER } from "@/utils/mapper.js";
export default {
  props: {
    data: {
      type: Object,
      default: () => {},
    },
    border: {
      type: Boolean,
      default: true,
    },
    noicon: Boolean,
    icon: {
      type: String,
      default: () => "arrow-right",
    },
    sort: Boolean,
  },
  computed: {
    size() {
      return this.sort ? "40px" : "50px";
    },
    tags() {
      let data = JSON.parse(this.data.certificate_platform || "[]");
      return []
      return data.map((i) => BANK_CERTIFICATE_MAPPER[i] || "未知类型");
    },
    verify_info() {
      let data = {};
      switch (Number(this.data.verify_status)) {
        case 1:
          data = {
            text: BANK_VERIFY_MAPPER[1],
            type: "info",
            icon: "info-circle",
          };
          break;
        case 1:
          data = {
            text: BANK_VERIFY_MAPPER[2],
            type: "success",
            icon: "checkmark-circle",
          };
          break;
        case 1:
          data = {
            text: BANK_VERIFY_MAPPER[3],
            type: "error",
            icon: "close-circle",
          };
          break;
        default:
          data = {
            text: "暂无信息",
            type: "info",
            icon: "info-circle",
          };
          break;
      }
      return data;
    },
    people_name() {
      if (!this.data.people_name) return "--";
      let length = this.data.people_name.length;
      let str = this.data.people_name.substr(0, 1);
      if (length <= 2) return str + "*";
      return `${str}*${this.data.people_name.substr(length - 1, 1)}`;
    },
    card_info() {
      let bank_short_name = this.data.bank_short_name || "暂无数据";
      if (!this.data.bank_account) return `${bank_short_name}（0000）`;
      let length = this.data.bank_account.length;
      return `${bank_short_name}（${this.data.bank_account.substr(
        length - 4,
        4
      )}）`;
    },
  },
};
</script>
<style lang="scss" scoped>
.bank-card {
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border-radius: 10rpx;
  margin-bottom: 20rpx;
  .banck-content-view {
    font-size: 28rpx;
    width: 400rpx;
  }
}
</style>
