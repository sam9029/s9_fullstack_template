<template>
  <view class="backfill-page" :class="{ 'no-scroll': no_scroll }">
    <view class="top-area">
      <MyNavbar :leftIcon="`${static_path}circular_back.png`">
        <template #navbarData>
          <text
            class="u-font-32 color-text-black u-font-bold"
            style="margin-left: 16rpx"
            >回填</text
          >
        </template>
      </MyNavbar>
    </view>
    <view class="u-p-x-28 u-m-t-28">
      <view
        class="u-bg-f u-border-radius u-p-24 u-flex-row u-row-between u-col-center u-m-b-28"
      >
        <view class="u-flex-row u-col-center">
          <u--image
            :src="detailObj.advertiser_icon"
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
              <text>{{ `${detailObj.feedback_num || 0}条` }}</text>
            </view>
            <view
              v-if="detailObj.settle_date"
              class="color-text-less-grey u-font-24 u-line-h-40"
              >{{ `数据更新至${detailObj.settle_date}` }}</view
            >
          </view>
        </view>
        <view
          class="color-text-white u-font-24 u-line-h-40 u-p-x-24 u-p-y-4"
          style="border-radius: 100px; background: #408cff"
          @click="goLog"
          >回填记录</view
        >
      </view>
      <view
        v-for="(item, index) in cardList"
        :key="index"
        class="u-bg-f u-p-32 u-border-radius u-m-b-28"
      >
        <view class="u-flex-row u-row-between u-col-center">
          <text class="color-text-black u-font-bold u-font-32 u-line-h-48">{{
            `作品${index + 1}`
          }}</text>
          <u-icon
            v-if="index > 0"
            name="trash"
            size="32rpx"
            @click="beforeDelItem(item, index)"
          ></u-icon>
        </view>

        <u--form
          :labelWidth="150"
          :model="item.model"
          :rules="item.rules"
          labelPosition="top"
          :ref="`form_${index}ref`"
        >
          <u-form-item
            v-for="(item_config, index_config) in item.configList"
            :key="index_config"
            :label="item_config.label"
            :prop="item_config.prop"
            :labelPosition="item_config.comp_type == 2 ? 'left' : 'top'"
          >
            <template v-if="item_config.comp_type == 2" #label>
              <view class="u-flew-row u-col-center">
                <text class="u-font-30 u-line-h-40">{{
                  item_config.label
                }}</text>
              </view>
            </template>
            <u-input
              v-if="
                item_config.comp_type == 1 &&
                item_config.prop != 'link' &&
                item_config.prop != 'opus_url'
              "
              v-model.trim="item_config.value"
              :placeholder="itemPlaceholder(item_config)"
              @input="
                updateModelValue({ item, index, item_config, index_config })
              "
            ></u-input>
            <u--textarea
              v-else-if="
                item_config.comp_type == 1 &&
                (item_config.prop == 'link' || item_config.prop == 'opus_url')
              "
              v-model.trim="item_config.value"
              maxlength="-1"
              @input="
                updateModelValue({ item, index, item_config, index_config })
              "
              :placeholder="itemPlaceholder(item_config)"
            ></u--textarea>
            <u-radio-group
              v-else-if="item_config.comp_type == 2"
              v-model="item_config.value"
              @input="
                updateModelValue({ item, index, item_config, index_config })
              "
              :placeholder="itemPlaceholder(item_config)"
            >
              <u-radio
                v-for="radio in item_config.dicts"
                :key="radio.id"
                :name="radio.value"
                :label="radio.label"
                class="u-m-l-32"
              ></u-radio>
            </u-radio-group>
            <view
              v-else-if="item_config.comp_type == 4"
              class="datetime-box u-relative widthAll"
            >
              <u-input
                v-model.trim="item_config.value"
                :placeholder="itemPlaceholder(item_config)"
                @input="
                  updateModelValue({ item, index, item_config, index_config })
                "
              >
                <u-icon
                  slot="suffix"
                  name="arrow-down"
                  size="32rpx"
                  color="#989898"
                ></u-icon>
              </u-input>
              <view
                class="picker-overlay"
                @click="item_config.visiable = !item_config.visiable"
              />
              <u-datetime-picker
                closeOnClickOverlay
                v-model="item_config.value"
                mode="date"
                round="16rpx"
                :show="item_config.visiable"
                :showToolbar="false"
                :minDate="
                  new Date(
                    detailObj.verify_feedback_time.split(' ')[0]
                  ).getTime()
                "
                @change="changeDatetime($event, item_config)"
              >
                <template #header>
                  <view
                    class="u-p-28 u-flex-row u-col-center u-row-between u-m-b-32"
                  >
                    <text
                      class="color-text-black u-font-bold u-font-32 u-line-h-48"
                      >{{ `请选择${item_config.label}` }}</text
                    >
                    <u-icon
                      :name="`${static_path}close_circle_grey.png`"
                      size="64rpx"
                      @click="item_config.visiable = !item_config.visiable"
                    ></u-icon>
                  </view>
                </template>
                <template #footer>
                  <view class="bottom-btns u-m-t-64">
                    <view
                      class="u-flex-row u-row-center u-col-center cancel-btn"
                      style="width: 346rpx; height: 108rpx"
                      @click="closeDatetime(item_config)"
                    >
                      <text class="u-font-28 color-text-less-grey">取消</text>
                    </view>
                    <view
                      class="u-flex-row u-row-center u-col-center"
                      style="height: 108rpx"
                      @click="
                        handleSubmit(item, index, item_config, index_config)
                      "
                    >
                      <text class="u-font-28 color-text-primary">确定</text>
                    </view>
                  </view>
                </template>
              </u-datetime-picker>
            </view>
            <SelectComps
              v-else-if="item_config.comp_type == 3"
              :title="`请选择${item_config.label}`"
              :item="item_config"
              :columns="selectCols(item_config.prop)"
              :needPicker="
                item_config.prop == 'platform_primary_id' ? false : true
              "
              @submit="
                getSelectVal($event, { item, index, item_config, index_config })
              "
              @open="openSelect(item, item_config, index, index_config)"
            ></SelectComps>
          </u-form-item>
        </u--form>
      </view>
      <view
        class="u-border-radius u-p-24 color-text-primary u-flex-row u-col-center u-row-center u-m-t-28"
        style="background: #ecf4ff"
        @click="addItem(false)"
      >
        <u-icon
          :name="`${static_path}cash_out_add_icon.png`"
          size="48rpx"
        ></u-icon>
        <text class="u-font-28 u-line-h-48 u-m-l-16">新增回填</text>
      </view>
      <view class="widthAll" :style="{ height: `${btnHeight}rpx` }"></view>
    </view>
    <BottomBtn
      :buttonIndex="0"
      :data="btnList"
      @submit="beforeFinalSubmit"
      @height="getBtnHeight"
    ></BottomBtn>
    <AccountPopup
      ref="accountPopupRef"
      title="请选择平台账号"
      :platform_id="platform_id"
      :extra_params="extra_params"
      @jump="handleJump"
      @next="getPlatformAcc"
      @close="no_scroll = false"
    />
    <BackfillPopup ref="errorPopupRef" @close="no_scroll = false" />
    <u-modal
      :show="showDelCard"
      title="温馨提示"
      showCancelButton
      confirmText="确认删除"
      content="删除后无法恢复，确认删除吗?"
      @cancel="showDelCard = false"
      @confirm="delItem"
    ></u-modal>
    <base-toast ref="toastRef"></base-toast>
  </view>
</template>

<script>
import MyNavbar from "@/components/my-navbar/index.vue";
import BottomBtn from "@/components/bottom-button/index.vue";
import SelectComps from "../components/selectComps.vue";
import BackfillPopup from "../components/backfillPopup.vue";
import AccountPopup from "../components/accountPopup.vue";
import { platform } from "@/api/public.js";
import { getPublishConfig, postPublishAdd } from "../api/backfill.js";
import { getKeywordLibraryDef } from "../api/keyword.js";
import { mapGetters } from "vuex";
import { sleep } from "@/utils/tools.js";
export default {
  components: {
    MyNavbar,
    BottomBtn,
    SelectComps,
    AccountPopup,
    BackfillPopup,
  },
  data() {
    return {
      delObj: {},
      detailObj: {},
      advertiser_type: null,
      id: null,
      showDelCard: false,
      no_scroll: false,
      extra_params: {},
      configReq: [],
      cardList: [],
      platformCols: [],
      platfromAccCols: [],
      platform_id: null,
      comps_type_mapper: {
        1: "input", // 输入框
        2: "select", // 本地下拉
        3: "fetch_select", // 远程下拉
        4: "datepicker", // 日期选择器
      },
      showDatetime: false,
      isUpdating: false,
      btnHeight: 0,
      acc_feedback: [],
    };
  },
  computed: {
    ...mapGetters(["static_path"]),
    btnList() {
      return [
        [
          {
            text: "确认提交",
            shape: "square",
            type: "primary",
            onClick: "submit",
            btnType: "button",
          },
        ],
      ];
    },
  },
  methods: {
    /**
     * @description: 更新cardList中的model值,才能参与u-form表单校验
     * @param {Object} item
     * @param {Number} index
     * @param {Object} item_config
     * @param {Number} index_config
     * @return {*}
     */
    updateModelValue({ item, index, item_config, index_config }) {
      // 更新model中的对应值
      this.$set(
        this.cardList[index].model,
        item_config.prop,
        item_config.value + ""
      );
    },

    getTotalData() {
      getKeywordLibraryDef({ id: this.id })
        .then((res) => {
          if (res.code == 0) {
            this.detailObj = res.data;
          }
        })
        .catch((error) => {
          this.toastMsg(error.message || error, "error");
        });
    },

    goLog() {
      uni.setStorageSync("SET_BACKFILL_DATA", JSON.stringify(this.cardList));
      uni.navigateTo({
        url: `/novel/detail/backfillLog?id=${this.id}`,
      });
    },

    selectCols(prop) {
      switch (prop) {
        case "platform_id":
          return this.platformCols;
        case "platform_primary_id":
          return this.platfromAccCols;
      }
    },

    init() {
      this.getTotalData();
      this.queryPlatform();
      this.getConfig();
    },

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
      getPublishConfig({ advertiser_type: this.advertiser_type })
        .then((res) => {
          if (res.code == 0) {
            this.configReq = res.data.list.map((el) => {
              return {
                ...el,
                value: null,
                visiable: false,
                inputValue: "",
              };
            });

            this.addItem(true);
          }
        })
        .catch((error) => {
          this.toastMsg(error.message || error, "error");
        });
    },

    /**
     * @description: 增加回填
     * @return {*}
     */
    addItem(init = false) {
      let model = {};
      const newList = this.configReq.map((el) => {
        model[el.prop] = null;
        return {
          ...el,
        };
      });
      if (init) {
        let stringifyData = uni.getStorageSync("SET_BACKFILL_DATA") || "";
        let storeData = stringifyData ? JSON.parse(stringifyData) : null;
        if (storeData) {
          this.cardList = storeData;
          uni.removeStorageSync("SET_BACKFILL_DATA");
        } else {
          this.cardList = [
            {
              model,
              rules: {
                opus_url: [
                  {
                    required: true,
                    message: "请填写作品链接",
                    trigger: "blur",
                  },
                ],
                opus_type: [
                  {
                    required: true,
                    message: "请选择作品类型",
                    trigger: ["change", "blur"],
                  },
                ],
                category_id: [
                  {
                    required: true,
                    message: "请选择作品类别",
                    trigger: ["change", "blur"],
                  },
                ],
                publish_date: [
                  {
                    required: true,
                    message: "请选择发布时间",
                    trigger: ["change", "blur"],
                  },
                ],
                platform_id: [
                  {
                    required: true,
                    message: "请选择发布平台",
                    trigger: ["change", "blur"],
                  },
                ],
                platform_primary_id: [
                  {
                    required: true,
                    message: "请选择平台账号",
                    trigger: ["change", "blur"],
                  },
                ],
              },
              configList: newList,
            },
          ];
        }
      } else {
        this.cardList.push({
          model,
          rules: {
            opus_url: [
              { required: true, message: "请填写作品链接", trigger: "blur" },
            ],
            opus_type: [
              {
                required: true,
                message: "请选择作品类型",
                trigger: ["change", "blur"],
              },
            ],
            category_id: [
              {
                required: true,
                message: "请选择作品类别",
                trigger: ["change", "blur"],
              },
            ],
            publish_date: [
              {
                required: true,
                message: "请选择发布时间",
                trigger: ["change", "blur"],
              },
            ],
            platform_id: [
              {
                required: true,
                message: "请选择发布平台",
                trigger: ["change", "blur"],
              },
            ],
            platform_primary_id: [
              {
                required: true,
                message: "请选择平台账号",
                trigger: ["change", "blur"],
              },
            ],
          },
          configList: newList,
        });
      }
    },

    /**
     * @description: 删除回填
     * @param {*} item
     * @param {*} index
     * @return {*}
     */
    beforeDelItem(item, index) {
      this.delObj = { item, index };
      this.showDelCard = true;
      this.$set(this.cardList[index], "acc_feedback", null);
    },

    delItem() {
      const newList = this.cardList.filter((el, i) => i != this.delObj.index);
      this.cardList = newList;
      this.showDelCard = false;
    },

    queryPlatform(keyword) {
      platform({ keyword })
        .then((res) => {
          if (res.code == 0) {
            this.platformCols = [res.data];
          }
        })
        .catch((error) => {
          this.toastMsg(error.message || error, "error");
        });
    },

    closeDatetime(item) {
      item.visiable = false;
    },

    changeDatetime(val, item) {
      item.value = uni.$u.timeFormat(val.value, "yyyy-mm-dd");
    },

    handleSubmit(item, index, item_config, index_config) {
      if (!item_config.value) {
        item_config.value = uni.$u.timeFormat(
          new Date(this.detailObj.verify_feedback_time.split(" ")[0]).getTime(),
          "yyyy-mm-dd"
        );
        this.$set(
          this.cardList[index].model,
          item_config.prop,
          uni.$u.timeFormat(
            new Date(
              this.detailObj.verify_feedback_time.split(" ")[0]
            ).getTime(),
            "yyyy-mm-dd"
          )
        );
      }
      item_config.visiable = false;
    },

    /**
     * @description: 筛选组件处理
     * @param {Object} val 当前选中值
     * @param {Object} item 当前回填数据
     * @return {*}
     */
    getSelectVal(val, { item, index, item_config, index_config }) {
      if (item_config.prop == "platform_id") {
        this.platform_id = val.value;
      }
      item_config.inputValue = val.label;
      item_config.value = val.value;
      this.updateModelValue({ item, item_config, index, index_config });
    },

    openSelect(item, item_config, index, index_config) {
      if (item_config.prop == "platform_primary_id") {
        this.extra_params = { item, item_config, index, index_config };
        this.$refs.accountPopupRef.open(
          this.id,
          this.cardList[index].acc_feedback
        );
        this.no_scroll = true;
      }
    },

    getPlatformAcc(obj) {
      const { extra_params, id, label } = obj;
      const index = extra_params.index;
      const index_config = extra_params.index_config;
      this.$set(this.cardList[index], "acc_feedback", id);

      this.$set(
        this.cardList[index].configList[index_config],
        "value",
        id + ""
      );
      this.$set(
        this.cardList[index].configList[index_config],
        "inputValue",
        label + ""
      );
      this.$set(this.cardList[index].model, "platform_primary_id", id + "");
    },

    getBtnHeight(height) {
      this.btnHeight = height * 2 + 28;
    },

    beforeFinalSubmit() {
      let validationPromises = this.cardList.map((el, index) => {
        return this.$refs[`form_${index}ref`][0]
          .validate()
          .then(() => index) // 验证成功时返回索引
          .catch((error) => null); // 如果验证失败返回 null
      });

      Promise.all(validationPromises).then((validFlags) => {
        // 过滤掉无效的验证（null）
        validFlags = validFlags.filter((index) => index !== null);

        if (validFlags.length === this.cardList.length) {
          const params = {
            details: this.cardList.map((el) => {
              if (el.model?.opus_url) {
                const match = el.model.opus_url.match(/(https:\/\/[^\s]+)/);
                const newUrl = match ? match[0] : null;
                return {
                  ...el.model,
                  opus_url: newUrl,
                };
              } else {
                return {
                  ...el.model,
                };
              }
            }),
            keyword_id: Number(this.id),
            advertiser_type: this.advertiser_type,
          };
          this.finalSubmit(params);
        }
      });
    },

    finalSubmit(params) {
      postPublishAdd(params)
        .then(async (res) => {
          if (res.code == 0) {
            this.toastMsg(res.message, "success");
            if (!res.data.unmatch_data.length) {
              uni?.removeStorageSync("SET_BACKFILL_DATA");
              await sleep(300);
              uni.redirectTo({
                url: `/novel/detail/backfillLog?id=${this.id}`,
              });
              this.reset();
            } else {
              this.$refs.errorPopupRef.open(
                res.data.unmatch_data.map((el, index) => el.reason)
              );
            }
          }
        })
        .catch((error) => {
          this.toastMsg(error.message || error, "error");
        });
    },

    reset() {
      this.cardList = [];
      this.configReq = [];
    },

    handleJump() {
      this.cardList = [];
      this.configReq = [];
    },

    toastMsg(message, type = "default", duration = 2000) {
      this.$refs.toastRef?.show({
        type,
        message,
        duration,
      });
    },
  },
  onLoad(options) {
    const { advertiser_id } = JSON.parse(uni.getStorageSync("SET_JUMP_QUERY"));
    this.id = options.keyword_id || null;
    this.advertiser_type = advertiser_id || null;
  },
  onShow() {
    this.init();
  },
};
</script>

<style lang="scss" scoped>
.backfill-page {
  min-height: 100vh;
  .top-area {
    z-index: 999;
    width: 750rpx;
    position: sticky;
    top: 0;
    background: #f6f7fb;
    /* #ifdef APP */
    padding-top: 88rpx;
    /* #endif */
  }
}
.picker-overlay {
  position: absolute;
  width: 100%;
  height: 88rpx;
  background: transparent;
  top: 0;
  left: 0;
}
.bottom-btns {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  justify-items: center;
  align-items: center;
  .cancel-btn {
    position: relative;
    &::after {
      content: "";
      position: absolute;
      top: 50%;
      right: 0;
      width: 1rpx;
      height: 32rpx;
      background: #eee;
      transform: translateY(-50%);
    }
  }
}
::v-deep .u-radio-group--row {
  justify-content: flex-end;
}
::v-deep .u-input {
  border-radius: 16rpx;
  height: 88rpx;
  background-color: #f6f6f6;
  border: none;
  padding: 24rpx 32rpx !important;
}
::v-deep .u-textarea {
  border-radius: 16rpx;
  background-color: #f6f6f6;
  border: none;
  padding: 24rpx 32rpx !important;
}
::v-deep .u-form-item__body__left {
  margin-bottom: 16rpx !important;
}
</style>
