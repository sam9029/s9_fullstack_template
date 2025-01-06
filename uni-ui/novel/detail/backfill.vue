<template>
  <view class="backfill-page">
    <MyNavbar :leftIcon="`${static_path}circular_back.png`">
      <template #navbarData>
        <text
          class="u-font-32 color-text-black u-font-bold"
          style="margin-left: 16rpx"
          >回填</text
        >
      </template>
    </MyNavbar>
    <view class="u-p-x-28 u-m-t-28">
      <view
        class="u-bg-f u-border-radius u-p-24 u-flex-row u-row-between u-col-center u-m-b-28"
      >
        <view class="u-flex-row u-col-center">
          <u--image
            :src="detailObj.advertiser_type_icon"
            radius="24rpx"
            width="140rpx"
            height="140rpx"
          ></u--image>
          <view class="u-m-l-24">
            <view
              class="u-font-bold u-font-28 u-line-h-44 color-text-black u-m-b-8"
              >{{ detailObj.advertiser_name || "--" }}</view
            >
            <view
              class="u-flex-row u-col-center color-text-less-black u-font-24 u-line-h-40 u-m-b-8"
            >
              <text>总回填</text>
              <view class="gap-line u-m-x-8"></view>
              <text>{{ `${detailObj.num || 0}条` }}</text>
            </view>
            <view class="color-text-less-grey u-font-24 u-line-h-40">{{
              `数据更新至${detailObj.date || "--"}`
            }}</view>
          </view>
        </view>
        <view
          class="color-text-white u-font-24 u-line-h-40 u-p-x-24 u-p-y-4"
          style="border-radius: 100px; background: #408cff"
          >回填记录</view
        >
      </view>
      <view
        v-for="(item, index) in cardList"
        :key="index"
        class="u-bg-f u-p-32 u-border-radius"
      >
        <view class="u-flex-row u-row-between u-col-center">
          <text class="color-text-black u-font-bold u-font-32 u-line-h-48">{{
            `作品${index + 1}`
          }}</text>
          <u-icon
            v-if="index > 0"
            name="trash"
            size="32rpx"
            @click="delItem(item)"
          ></u-icon>
        </view>

        <u--form
          :labelWidth="160"
          :model="item.model"
          labelPosition="top"
          :ref="`form_${index}ref`"
        >
          <u-form-item
            v-for="(item_config, index_config) in item.configList"
            :key="index_config"
            :label="item_config.label"
            :prop="item_config.prop"
          >
            <u--input
              v-if="item_config.comp_type == 1 && item_config.prop != 'link'"
              v-model.trim="item_config.value"
              :placeholder="itemPlaceholder(item_config)"
            ></u--input>
            <u--textarea
              v-if="item_config.comp_type == 1 && item_config.prop == 'link'"
              v-model.trim="item_config.value"
              :placeholder="itemPlaceholder(item_config)"
            ></u--textarea>
            <u-radio-group
              v-if="item_config.comp_type == 2"
              v-model="item_config.value"
              :placeholder="itemPlaceholder(item_config)"
            >
              <u-radio
                v-for="radio in item_config.dicts"
                :key="radio.id"
                :name="radio.value"
                :label="radio.label"
              ></u-radio>
            </u-radio-group>
            <!-- <u-datetime-picker
              v-if="item_config.comp_type == 4"
              :show="datetime_show"
              closeOnClickOverlay
              v-model="datetimeData"
              mode="date"
            ></u-datetime-picker> -->
          </u-form-item>
        </u--form>
      </view>
      <view
        class="u-border-radius u-p-24 color-text-primary u-flex-row u-col-center u-row-center u-m-t-28"
        style="background: #ecf4ff"
        @click="addItem"
      >
        <u-icon
          :name="`${static_path}cash_out_add_icon.png`"
          size="48rpx"
        ></u-icon>
        <text class="u-font-28 u-line-h-48 u-m-l-16">新增回填</text>
      </view>
    </view>
    <base-toast ref="toastRef"></base-toast>
  </view>
</template>

<script>
import MyNavbar from "@/components/my-navbar/index.vue";
import BottomBtn from "@/components/bottom-button/index.vue";
import { getPublishConfig } from "../api/backfill.js";
import { mapGetters } from "vuex";
export default {
  components: {
    MyNavbar,
    BottomBtn,
  },
  data() {
    return {
      detailObj: {},
      advertiser_type: null,
      keyword_id: null,
      initObj: {},
      configReq: [],
      cardList: [],
      comps_type_mapper: {
        1: "input", // 输入框
        2: "select", // 本地下拉
        3: "fetch_select", // 远程下拉
        4: "datepicker", // 日期选择器
      },
    };
  },
  computed: {
    ...mapGetters(["static_path"]),
  },
  methods: {
    init() {},

    itemPlaceholder(item) {
      switch (item.comp_type) {
        case 1:
          return `请输入${item.label}`;
        case 2:
        case 3:
        case 4:
          return `请选择${item.label}`;
      }
    },

    getConfig() {
      getPublishConfig()
        .then((res) => {
          if (res.code == 0) {
            this.configReq = res.data.map((el) => {
              let value;
              switch (el.comp_type) {
                case 1:
                case 2:
                case 4:
                  value = null;
                  break;
                case 3:
                  value = [];
                  break;
              }
              return {
                ...el,
                value,
              };
            });
          }
        })
        .catch((error) => {
          this.toastMsg(error, "error");
        });
    },

    addItem() {
      // 每次新增增加接口配置
      let model = {};
      this.configReq.forEach(el => {
        model[el.prop] = null;
      })
      this.cardList.push({ model, configList: this.configReq });
      console.log(this.cardList)
    },

    delItem(item) {},

    toastMsg(message, type = "default") {
      this.$refs.toastRef?.show({
        type,
        message,
      });
    },
  },
  onLoad() {
    this.getConfig();
  },

  onShow() {
    this.getConfig();
  },
};
</script>

<style lang="scss" scoped>
.backfill-page {
  min-height: 100vh;
}
</style>
