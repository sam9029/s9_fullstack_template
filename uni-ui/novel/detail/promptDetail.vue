<template>
  <view class="prompt-detail-page" :class="{ 'no-scroll': no_scroll }">
    <view class="top-area">
      <MyNavbar :leftIcon="`${static_path}circular_back.png`">
        <template #navbarData>
          <text
            class="u-font-32 color-text-black u-font-bold"
            style="margin-left: 16rpx"
            >{{ is_view ? "提词详情" : "新建关键词" }}</text
          >
        </template>
      </MyNavbar>
    </view>
    <view class="u-m-t-28 u-p-x-28">
      <view class="u-bg-f u-border-radius u-p-32 u-m-b-28">
        <view
          v-if="!is_view"
          class="u-font-bold u-font-32 u-line-h-48 color-text-black"
          >请填写书籍信息</view
        >
        <view v-else class="u-border-radius u-border-custom u-p-24 u-m-b-32">
          <view class="u-flex-row u-col-center">
            <text
              class="u-font-bold color-text-black u-font-28 u-line-h-40 u-m-r-8"
              >{{ detailObj.keyword || "--" }}</text
            >
            <view
              class="u-flex-row u-row-center u-col-center u-m-l-8 u-p-x-8"
              :class="{
                'tag--primary': detailObj.verify_status == 2,
                'tag--warning':
                  detailObj.verify_status == 1 || detailObj.verify_status == 4,
                'tag--danger': detailObj.verify_status == 3,
              }"
            >
              <text class="u-font-22 u-line-h-40 u-nowrap">{{
                LIBRARY_VERIFY_STATUS[detailObj.verify_status]
              }}</text>
              <u-icon
                v-if="detailObj.verify_status == 3"
                class="u-m-l-8"
                name="question-circle"
                size="24rpx"
                color="#FF325B"
                style="position: relative; top: 2rpx"
                @click="openSuggest"
              ></u-icon>
            </view>
          </view>
          <view class="color-text-less-grey u-font-24 u-line-h-40">{{
            `提词时间: ${detailObj.create_time}`
          }}</view>
        </view>
        <u--form
          :model="model"
          :rules="rules"
          labelPosition="top"
          labelWidth="160rpx"
          ref="formRef"
        >
          <u-form-item
            v-for="(item, index) in configList"
            :key="item.prop"
            :label="item.label"
            :prop="item.prop"
            :labelPosition="item.comp_type == 2 ? 'left' : 'top'"
          >
            <u--textarea
              v-if="item.prop == 'link' || item.prop == 'describe'"
              v-model.trim="model[item.prop]"
              :disabled="is_view"
              :placeholder="`请输入${item.label}`"
              maxlength="-1"
              @input="handleInput($event, item)"
            ></u--textarea>
            <u-input
              v-else-if="item.comp_type == 1"
              v-model="model[item.prop]"
              disabledColor="#f6f6f6"
              :disabled="is_view"
              clearable
              :placeholder="`请输入${item.label}`"
            ></u-input>
            <view
              v-else-if="item.comp_type == 2"
              class="u-flex-row u-row-right u-col-center widthAll"
            >
              <u-radio-group
                v-model="model[item.prop]"
                :placeholder="`请选择${item.label}`"
                :disabled="is_view"
              >
                <u-radio
                  v-for="radio in item.dicts"
                  :key="radio.id"
                  :name="radio.value"
                  :label="radio.label"
                  class="u-m-l-32"
                ></u-radio>
              </u-radio-group>
            </view>
            <SelectComps
              v-else-if="item.comp_type == 3"
              v-model="detailObj[item.prop]"
              :view="is_view"
              :title="`请选择${item.label}`"
              :item="item"
              :disabled="is_view"
              :needPicker="item.prop == 'platform_account_id' ? false : true"
              @submit="getSelectVal($event, { item, index })"
              @open="openSelect(item, index)"
            ></SelectComps>
          </u-form-item>
        </u--form>
      </view>

      <view v-if="!is_view" class="u-bg-f u-border-radius u-p-32">
        <view
          class="color-text-black u-font-32 u-line-h-48 u-font-bold u-m-b-32"
          >请创建推广关键词</view
        >
        <u--form
          ref="keywordFormRef"
          :model="keywordModel"
          :rules="keywordRules"
          labelPosition="left"
          labelWidth="240rpx"
        >
          <u-form-item prop="keywords">
            <view class="u-flex-col widthAll">
              <view class="u-flex-row u-col-center u-m-b-32">
                <u-input
                  v-model.trim="keyword"
                  clearable
                  placeholder="请输入关键词"
                ></u-input>
                <view
                  class="u-border-radius u-m-l-16 u-flex-row u-col-center u-row-center"
                  style="width: 120rpx; height: 88rpx; background: #408cff"
                  @click="handleKeyword"
                >
                  <text class="color-text-white u-font-28 u-line-h-44"
                    >添加</text
                  >
                </view>
              </view>
              <view
                v-if="keywordModel.keywords.length"
                class="keyword-pond u-border-radius u-p-32 scroll-y widthAll"
              >
                <view
                  v-for="(item, index) in keywordModel.keywords"
                  :key="index"
                  class="keyword-pond--item u-bg-f u-border-radius u-flex-row u-row-center u-col-center u-p-x-16 u-p-y-8 u-m-r-16 u-m-b-16"
                >
                  <text
                    class="color-text-less-black u-font-24 u-line-h-40 u-m-r-8 u-nowrap"
                    >{{ item.keyword }}</text
                  >
                  <u-icon
                    :name="`${static_path}close_circle_grey.png`"
                    size="36rpx"
                    @click="delKeyword(index)"
                  ></u-icon>
                </view>
              </view>
            </view>
          </u-form-item>
        </u--form>
      </view>
      <view
        v-if="!is_view"
        class="widthAll"
        :style="{ height: this.btnHeight + 32 + 'rpx' }"
      ></view>
    </view>
    <BottomBtn
      v-if="!is_view"
      :data="button_list"
      :buttonIndex="0"
      @submit="handleSubmit"
      @height="getBtnHeight"
    />
    <u-modal
      :show="showModal"
      :showCancelButton="false"
      :showConfirmButton="true"
      confirmText="我知道了"
      title="审核失败"
      :content="verify_suggest"
      :buttonFill="false"
      :closeOnClickOverlay="false"
      @confirm="showModal = false"
    >
    </u-modal>
    <KeywordPopup ref="keywordPopupRef" @close="no_scroll = false" />
    <AccountPopup
      ref="accountPopupRef"
      title="请选择平台账号"
      :platform_id="platform_id"
      :extra_params="extra_params"
      @next="getPlatformAcc"
      @close="no_scroll = false"
    />
    <base-toast ref="toastRef"></base-toast>
  </view>
</template>

<script>
import { mapGetters } from "vuex";
import MyNavbar from "@/components/my-navbar/index.vue";
import BottomBtn from "@/components/bottom-button/index.vue";
import KeywordPopup from "../components/keywordPopup.vue";
import SelectComps from "../components/selectComps.vue";
import AccountPopup from "../components/accountPopup.vue";
import {
  postLibraryAdd,
  getLibraryContentConfig,
  getLibraryConfig,
  postLibraryContentKeywordAdd,
  getKeywordLibraryDef,
  getAnalysisLink,
} from "../api/keyword.js";
import { LIBRARY_VERIFY_STATUS } from "@/utils/mappers/novel.js";
import { sleep, throttle, queryUrlParams } from "@/utils/tools.js";
export default {
  props: {},
  components: {
    MyNavbar,
    BottomBtn,
    KeywordPopup,
    SelectComps,
    AccountPopup,
  },
  data() {
    return {
      LIBRARY_VERIFY_STATUS,
      id: null,
      showModal: false,
      keyword: "",
      verify_suggest: "",
      keywordList: [],
      btnHeight: "0",
      submitLoading: false,
      advertiser_type: null,
      content_id: null,
      content_relation_id: null,
      no_scroll: false,
      configList: [],
      keywordConfig: [],
      detailObj: {},
      selectCols: [],
      extra_params: {},
      platform_id: null,
      customLinkMapper: {
        1009: '掌阅',
        1008: '起点',
        1001: '番茄小说',
        1004: '番茄畅听'
      },
      model: {
        title: "",
        book_author: "",
        book_id: "",
        link: "",
        describe: "",
        is_video: "1",
        platform_account_id: "",
      },
      rules: {
        title: [{ required: true, message: "请输入书籍名称", trigger: "blur" }],
        book_name: [
          { required: true, message: "请输入书籍名称", trigger: "blur" },
        ],
        book_author: [
          { required: true, message: "请输入作者", trigger: "blur" },
        ],
        book_id: [{ required: true, message: "请输入书籍ID", trigger: "blur" }],
        link: [{ required: true, message: "请输入书籍链接", trigger: "blur" }],
        describe: [
          { required: true, message: "请输入书籍简介", trigger: "blur" },
        ],
        is_video: [
          {
            validator: (rule, value, callback) => {
              if (!value) {
                callback(false);
              } else {
                callback();
              }
            },
            message: "请选择是否视频号发布",
            trigger: "change",
          },
        ],
      },
      keywordModel: {
        keywords: [],
      },
    };
  },
  computed: {
    ...mapGetters(["static_path", "image"]),
    button_list() {
      return [
        [
          {
            text: "确认提交",
            shape: "square",
            type: "primary",
            onClick: "submit",
            loading: this.submitLoading,
            btnType: "button",
          },
        ],
      ];
    },
    is_view() {
      return this.id ? true : false;
    },
    keywordRules() {
      return {
        keywords: [
          {
            validator: (rule, value, callback) => {
              if (!value.length) {
                callback(false);
              } else {
                callback();
              }
            },
            message: "请添加关键词",
            trigger: ["change", "blur"],
          },
        ],
      };
    },
  },
  methods: {
    getBtnHeight(height) {
      this.btnHeight = height * 2;
    },

    openSuggest() {
      this.verify_suggest = this.model.verify_suggest;
      this.showModal = true;
    },

    getDetial() {
      this.toastMsg("加载中", "loading", -1);
      getKeywordLibraryDef({ id: this.id })
        .then((res) => {
          if (res.code == 0) {
            this.detailObj = res.data;
            this.$refs.toastRef.close();
          }
        })
        .catch((error) => {
          his.toastMsg(error.message || error, "error");
        });
    },

    /**
     * @description: 提交校验
     * @return {*}
     */
    async validSubmit() {
      const results = await Promise.all([
        this.$refs.formRef
          .validate()
          .then(() => true)
          .catch(() => false),
        this.$refs.keywordFormRef
          .validate()
          .then(() => true)
          .catch(() => false),
      ]);
      return results[0] && results[1];
    },

    async handleSubmit() {
      if (await this.validSubmit()) {
        this.addLibraryContent();
      }
    },

    /**
     * @description: 最后提交
     * @return {*}
     */
    addLibraryContent() {
      const params = {
        ...this.model,
        ...this.keywordModel,
        keywords: this.keywordModel.keywords.map((el) => el.keyword),
        advertiser_type: this.advertiser_type,
      };
      postLibraryContentKeywordAdd(params)
        .then((res) => {
          if (res.code == 0) {
            this.toastMsg(
              res.data.message,
              res.data.message.indexOf("失败") ? "error" : "success"
            );
            if (res.data.unmatch_data.length) {
              this.keywordModel.keywords = res.data.unmatch_data;
              this.no_scroll = true;
              this.$refs.keywordPopupRef.open(this.handleErrorStr());
            } else {
              uni.redirectTo({
                url: "/novel/detail/index",
              });
            }
          }
        })
        .catch((error) => {
          this.toastMsg(error.message || error, "error");
        });
    },

    /**
     * @description: 书籍相关配置
     * @return {*}
     */
    libraryContentConfig() {
      const params = {
        advertiser_type: this.advertiser_type,
      };
      getLibraryContentConfig(params)
        .then((res) => {
          if (res.code == 0) {
            this.configList = res.data.list.map((el) => {
              return {
                ...el,
                value: "",
                inputValue: "",
              };
            });
            if (!this.is_view) {
              const obj = Object.fromEntries(
                res.data.list.map((el) => [el.prop, null])
              );
              this.model = obj;
            } else {
              this.model = this.detailObj;
            }
          }
        })
        .catch((error) => {
          his.toastMsg(error.message || error?.message || error, "error");
        });
    },

    /**
     * @description: 添加关键词接口
     * @return {*}
     */
    addKeyword() {
      const params = {
        keywords: this.keywordList,
        content_id: this.content_id,
        content_relation_id: this.content_relation_id,
        advertiser_type: this.advertiser_type,
        is_video: this.is_video,
      };
      postLibraryAdd(params)
        .then((res) => {
          if (res.code == 0) {
            this.toastMsg(res.data.message, "success");
            if (res.data.unmatch_data.length) {
              this.keywordList = res.data.unmatch_data;
              this.no_scroll = true;
              this.$refs.keywordPopupRef.open(this.handleErrorStr());
            } else {
              uni.redirectTo({
                url: "/novel/detail/index",
              });
            }
          }
        })
        .catch((error) => {
          his.toastMsg(error.message || error, "error");
        });
    },

    /**
     * @description: 处理关键词数据
     * @return {*}
     */
    handleKeyword() {
      if (!this.keyword) return;
      if (this.keywordModel.keywords.find((el) => el == this.keyword)) {
        return this.toastMsg("关键词已存在", "error");
      }
      this.keywordModel.keywords = [
        ...this.keywordModel.keywords,
        {
          keyword: this.keyword,
          message: "",
        },
      ];
      this.keyword = "";
    },

    delKeyword(index) {
      this.keywordModel.keywords = [
        ...this.keywordModel.keywords.slice(0, index),
        ...this.keywordModel.keywords.slice(index + 1),
      ];
    },

    /**
     * @description: 关键词限制要求及绑定配置
     * @return {*}
     */
    libraryConfig() {
      this.toastMsg("加载中", "loading", -1);
      getLibraryConfig({ advertiser_type: this.advertiser_type })
        .then((res) => {
          if (res.code == 0) {
            this.configList = [
              ...this.configList,
              ...res.data.bind_config.map((el) => {
                return { ...el, value: "", inputValue: "" };
              }),
            ];
            // 将绑定相关配置追加到动态表单中
            if (!this.is_view) {
              const obj = Object.fromEntries(
                res.data.bind_config.map((el) => [el.prop, null])
              );
              this.model = { ...this.model, ...obj };
            }
            this.keywordConfig = res.data.keyword_config;
            this.$refs.toastRef.close();
          }
        })
        .catch((error) => {
          his.toastMsg(error.message || error, "error");
        });
    },

    handleErrorStr() {
      let errorList = [];
      this.keywordModel.keywords.forEach((el, index) => {
        errorList.push(`关键词《${el.keyword}》${el.message}`);
      });
      return errorList;
    },

    resetPage() {
      this.id = null;
      this.model = this.$options.data().model;
    },

    /**
     * @description: 筛选组件处理
     * @param {Object} val 当前选中值
     * @param {Object} item 当前回填数据
     * @return {*}
     */
    getSelectVal(val, { item, index }) {
      item.inputValue = val.label;
      item.value = val.value;
      this.$set(this.configList[index], "value", val.value + "");
      this.$set(this.configList[index], "inputValue", val.label);
      if (item.prop == "platform_account_id") {
        this.platform_id = val.value;
      }
    },

    openSelect(item, index) {
      if (item.prop == "platform_account_id") {
        this.extra_params = { item, index };
        this.$refs.accountPopupRef.open(this.id, model.platform_account_id);
        this.no_scroll = true;
      }
    },

    getPlatformAcc(obj) {
      const { extra_params, id, label } = obj;
      this.model.platform_account_id = id;
      this.$set(this.configList[extra_params.index], "value", id + "");
      this.$set(this.configList[extra_params.index], "inputValue", label);
    },

    // 针对项目处理book_id回显
    handleInput: throttle(function func(val, item) {
      const list = Object.keys(this.customLinkMapper);
      if(list.includes(this.advertiser_type+'')) {
        let obj = queryUrlParams(val);
        switch(this.advertiser_type+'') {
          case '1009':
          this.model.book_id = obj.bid;
          break;
          case '1008':
          this.model.book_id = obj.bookId;
          break;
          case '1001':
          case '1004':
          this.model.book_id = obj.book_id;
          break;
        }
      } else {
        getAnalysisLink({ 
          link: val, 
          advertiser_type: this.advertiser_type 
        })
          .then((res) => {
            if(res.code == 0) {
              if(res.data.book_id) {
                this.model.book_id = res.data.book_id;
              }
            }
          })
          .catch((error) => {
            this.toastMsg(error.message || error, "error");
          });
      }
    }, 800),

    toastMsg(message, type = "default", duration = 2000) {
      this.$refs.toastRef?.show({
        type,
        message,
        duration,
      });
    },
  },
  onLoad({ id }) {
    const { advertiser_id } = JSON.parse(uni.getStorageSync("SET_JUMP_QUERY"));
    this.advertiser_type = advertiser_id || null;
    this.resetPage();
    this.id = id || null;

    if (id) {
      this.getDetial();
    }
    this.libraryContentConfig();
    this.libraryConfig();
  },
};
</script>

<style lang="scss" scoped>
.prompt-detail-page {
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
.keyword-pond {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  height: 280rpx;
  background: #f6f6f6;
  &--item {
    width: fit-content;
    height: 56rpx;
  }
}
::v-deep .app-grid {
  background: #f6f6f6;
}
::v-deep .u-form-item__body__left {
  margin-bottom: 16rpx !important;
}
::v-deep .u-input,
.u-textarea {
  border-radius: 16rpx;
  background-color: #f6f6f6;
  border: none;
  padding: 24rpx 32rpx !important;
}
.tag--primary {
  border-radius: 8rpx;
  background: #ecf4ff;
  color: $u-primary;
}
.tag--warning {
  border-radius: 8rpx;
  background: #fff5ee;
  color: $u-orange-6;
}
.tag--danger {
  border-radius: 8rpx;
  background: #ffebef;
  color: $u-red-6;
}
::v-deep .u-radio-group {
  flex: none;
  &--row {
    display: flex;
  }
}
</style>
