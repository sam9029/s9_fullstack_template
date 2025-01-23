<template>
  <u-popup :show="visible" round="8" mode="bottom" closeable @close="close">
    <view class="select-container u-p-l-28 u-p-r-28 u-p-b-28">
      <text class="select-title u-font-bold color-text-black u-font-16">{{
        title
      }}</text>
      <view class="select-search u-m-t-100">
        <u-search
          :showAction="false"
          placeholder="请输入项目名称"
          v-model.trim="keyword"
          @search="onSearch"
          @clear="onClear"
        ></u-search>
      </view>
      <view v-if="projectList.length" :class="{ 'u-m-t-40': loading }">
        <u-skeleton
          rows="4"
          :title="false"
          :loading="loading"
          rowsWidth="100%"
          rowsHeight="58"
        >
          <view class="select-box">
            <template v-for="(item, index) in projectList">
              <view
                v-if="item.label"
                :key="index"
                class="select-item u-border-radius u-flex-row u-col-center"
                :class="{ active: currentSelect.value == item.value }"
                @click="handleSelect(item)"
              >
                <u--image
                  radius="4"
                  width="40rpx"
                  height="40rpx"
                  :src="item.icon"
                />
                <text
                  class="u-m-l-16 u-font-14 color-text-black u-font-bold u-line-1"
                  >{{ item.label }}</text
                >
              </view>
            </template>
          </view>
        </u-skeleton>
      </view>
      <u-empty
        v-else
        text="暂无项目"
        icon="http://cdn.uviewui.com/uview/empty/news.png"
      ></u-empty>
      <base-toast ref="toastRef"></base-toast>
    </view>
  </u-popup>
</template>

<script>
import { throttle } from "@/utils/tools.js";
import { taskFrame } from "@/static/icon.js";
import { getAdvertiserType } from "@/api/public.js";
/**
 * @description 默认请求项目接口/public/advertiser
 * ---------------------------------------------------
 * @event{Function} change - 传参：currentSelect - 当前选中项目obj
 * @event{Function} open - - 打开时
 * @event{Function} close - - 关闭时
 * @event{Function} search - 传参：keyword - 搜索关键字
 * @event{Function} clear - - 清除搜索内容时
 * ----------------------------------------------------
 * 内置方法
 * @event{Function} setSelect - 传参：obj { icon: String, value: String | Number, label: String } - 选中的项目
 * @event{Function} setKeyword - 传参：str - keyword的参数
 */
export default {
  options: {
    styleIsolation: "shared",
  },
  props: {
    list: {
      type: Array,
      default: () => [],
    },
    title: {
      type: String,
      default: "请选择",
    },
    frameTitle: {
      type: String,
      default: "全部项目",
    },
    needAll: {
      type: Boolean,
      default: true,
    },
    reqType: {
      type: String,
      default: "ADVERTISER",
    },
    reqParams: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      visible: false,
      keyword: "",
      currentSelect: {
        icon: taskFrame,
        value: "all",
        label: this.frameTitle,
      },
      defaultList: [],
      projectList: [],
      loading: false,
      have_id: null
    };
  },
  watch: {
    currentSelect: {
      handler(newVal) {
        if (newVal) {
          this.$emit("change", newVal);
        }
      },
      deep: true,
    },
    list: {
      handler(newVal) {
        if (Array.isArray(newVal)) {
          this.handleProjectList("SEARCH");
        }
      },
      deep: true,
    },
    reqType: {
      handler(newVal) {
        if (newVal != "ADVERTISER") {
          if (!Array.isArray(this.list) && this.list.length > 0) {
            throw new Error("reqType自定义时，请传入list数组!");
          }
        }
      },
    },
  },
  methods: {
    // 选择渠道
    handleSelect: throttle(function func(item) {
      this.currentSelect = item;
      this.keyword = "";
      this.visible = false;
    }, 500),

    /**
     * @description: 可配置是否需要选中当前项目
     * @param {String} type DEFAULT -> 正常逻辑 SEARCH -> 搜索逻辑
     * @param {String|Number} ad_id 需要选中的项目id
     * @return {*}
     */    
    async handleProjectList(type, ad_id = null) {
      let locList = [];
      // 判断 reqType 是否有 "ADVERTISER" 字符串
      if (this.reqType.includes("ADVERTISER")) {
        await this.getAdvertiser();
        // 获取广告相关的列表
        locList = this.getAdvertiserList(type);
      } else {
        // 获取其他类型的列表
        locList = this.getOtherList(type);
      }

      if (!this.currentSelect?.value) this.currentSelect = locList[0];
      if (ad_id) this.currentSelect = locList.find(el => el.value == ad_id);
      if (Array.isArray(locList) && locList.length > 0) {
        setTimeout(() => (this.loading = false), 500);
      } else {
        this.loading = true;
      }
      this.projectList = locList;
    },

    // 广告相关的列表获取方法
    /**
     * @description: 如果needAll为真，type为“DEFAULT” 并且 defaultList为非空数组,返回带有“全部”的数组；否则返回原始接口数组
     * @param {String} type 是否需要“全部”  DEFAULT -> 全部 
     * @constant {Boolean} needAll true -> 需要全部 flase -> 不需要全部
     * @return {*}
     */    
    getAdvertiserList(type) {
      return this.needAll &&
        type === "DEFAULT" &&
        Array.isArray(this.defaultList) &&
        this.defaultList.length > 0
        ? [
            { label: this.frameTitle, icon: taskFrame, value: "all" },
            ...this.defaultList,
          ]
        : [...this.defaultList];
    },

    // 其他类型的列表获取方法
    /**
     * @description: 如果needAll为真，type为“DEFAULT” 并且 props传入自定义数组为非空数组,返回带有“全部”的数组；否则返回原始接口数组
     * @param {String} type 是否需要“全部”  DEFAULT -> 全部 
     * @constant {Boolean} needAll true -> 需要全部 flase -> 不需要全部
     * @return {*}
     */    
    getOtherList(type) {
      return this.needAll &&
        type === "DEFAULT" &&
        Array.isArray(this.list) &&
        this.list.length > 0
        ? [
            { label: this.frameTitle, icon: taskFrame, value: "all" },
            ...this.list,
          ]
        : [...this.list];
    },

    /**
     * @description: 默认开启弹窗开关，可传入参数控制默认不开启
     * @param {Boolean} flag true -> 开启弹窗 false -> 不开启弹窗
     * @return {*}
     */    
    open: throttle(function func(flag = true) {
      if (flag) this.visible = true;
      this.handleProjectList("DEFAULT");
      this.$emit("open");
    }, 500),

    close() {
      this.visible = false;
      this.keyword = '';
      this.$emit("close");
    },

    // 设置currentSelect
    /**
     * @description: 父组件设置当前选中项目，可配置是否需要将当前项目存在于当前列表中
     * @param {Object} obj { icon:String 图标, value: String|Number 值, label: String 名称 }
     * @param {Boolean} needReq true -> 需要存在 false -> 不需要存在
     * @return {*}
     */    
    setSelect(obj, needReq = false) {
      const { icon, value, label } = obj;
      if (!icon && !value && !label) {
        throw new Error("请设置参数icon、value、label!");
      } else {
        this.currentSelect = obj;
        this.selectNeedReq(obj, needReq)
      }
    },

    selectNeedReq(obj, needReq) {
      if(needReq) {
        this.have_id = obj.value
        this.handleProjectList("DEFAULT", obj.value);
      }
    },

    // 设置keyword
    /**
     * @description: 可配置默认查询关键词
     * @param {String} str 项目查询关键词
     * @return {*}
     */    
    setKeyword(str = "") {
      if (!str) {
        throw new Error("请设置参数keyword!");
      } else {
        this.keyword = str.trim();
        this.onSearch(str.trim());
      }
    },

    // 搜索
    /**
     * @description: 针对清除和默认搜索的处理函数，如果有输入值，则将参数传递给父组件并且走“SEARCH”模式
     * @param {String} val 搜索项目的关键词，此参数可为名称或者advertiser_type
     * @return {*}
     */    
    onSearch: throttle(async function func(val) {
      if (val) this.$emit("search", val);
      this.loading = true;
      if (this.keyword) {
        this.handleProjectList("SEARCH");
      } else {
        this.handleProjectList("DEFAULT");
      }
    }, 500),

    // 清除
    onClear() {
      this.$emit("clear");
      this.handleProjectList("DEFAULT");
    },

    // 获取项目
    async getAdvertiser() {
      try {
        let params = {
          ...this.reqParams
        };
        if (this.keyword) params.keyword = this.keyword;
        if (this.have_id && !this.keyword) params.have_id = this.have_id;
        const res = await getAdvertiserType(params);
        if (res.code === 0) {
          this.defaultList = res.data;
          this.$emit("list", res.data);
        }
      } catch (error) {
        this.projectList = [];
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
.select-container {
  position: relative;
  height: 100%;
  .select-title {
    position: absolute;
    top: 30rpx;
    left: 30rpx;
  }
  .select-loading {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  .select-box {
    overflow-y: auto;
    margin-top: 32rpx;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(auto-fill, 100rpx);
    grid-gap: 24rpx;
    height: 608rpx;

    .select-item {
      height: 100rpx;
      display: flex;
      align-items: center;
      padding: 0 40rpx;
      background-color: #eeeeee;
      color: #a3a3a3;
      font-size: 24rpx;
      border: 2rpx solid transparent;
    }
    // #ifdef MP
    .active {
      border: 1px solid $u-primary;
      background-color: $u-primary-light;
      text {
        color: $u-primary;
      }
    }
    // #endif
    // #ifndef MP
    .active {
      border: 2rpx solid var(--boyao-primary-color);
      background-color: var(--boyao-primary-color-5);
      text {
        color: var(--boyao-primary-color);
      }
    }
    // #endif
  }
}
</style>
