<template>
  <view class="prompt-detail-page">
    <MyNavbar :leftIcon="`${static_path}circular_back.png`">
      <template #navbarData>
        <text
          class="u-font-32 color-text-black u-font-bold"
          style="margin-left: 16rpx"
          >{{ is_view ? "提词详情" : "新建关键词" }}</text
        >
      </template>
    </MyNavbar>
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
              >{{ model.title || "--" }}</text
            >
            <view
              class="u-flex-row u-row-center u-col-center u-m-l-8 u-p-x-8"
              :class="{
                'tag--primary': model.verify_status == 2,
                'tag--warning': model.verify_status == 1,
                'tag--danger': model.verify_status == 3,
              }"
            >
              <text class="u-font-22 u-line-h-40 u-nowrap">{{
                LIBRARY_VERIFY_STATUS[model.verify_status]
              }}</text>
              <u-icon
                v-if="model.verify_status == 3"
                class="u-m-l-8"
                name="question-circle"
                size="24rpx"
                color="#FF325B"
                style="position: relative; top: 2rpx"
              ></u-icon>
            </view>
          </view>
          <view class="color-text-less-grey u-font-24 u-line-h-40">{{
            `提词时间: ${model.date}`
          }}</view>
        </view>
        <u--form
          :model="model"
          :rules="rules"
          labelPosition="top"
          labelWidth="160rpx"
          ref="formRef"
        >
          <u-form-item label="书籍名称" prop="book_name">
            <u-input
              v-model="model.book_name"
              disabledColor="#f6f6f6"
              :disabled="is_view"
              placeholder="请选择书籍名称"
            ></u-input>
          </u-form-item>
          <u-form-item label="作者" prop="auth">
            <u-input
              v-model.trim="model.auth"
              :disabled="is_view"
              placeholder="请输入作者"
            ></u-input>
          </u-form-item>
          <u-form-item label="书籍ID" prop="book_id">
            <u-input
              v-model.trim="model.book_id"
              :disabled="is_view"
              placeholder="请输入书籍ID"
            ></u-input>
          </u-form-item>
          <u-form-item label="书籍链接" prop="book_link">
            <u--textarea
              v-model.trim="model.book_link"
              :disabled="is_view"
              placeholder="请输入书籍链接"
            ></u--textarea>
          </u-form-item>
          <u-form-item label="书籍简介" prop="desc">
            <u--textarea
              v-model.trim="model.desc"
              :disabled="is_view"
              placeholder="请输入书籍简介"
            ></u--textarea>
          </u-form-item>
        </u--form>
      </view>

      <view v-if="!is_view" class="u-bg-f u-border-radius u-p-32">
        <view
          class="color-text-black u-font-32 u-line-h-48 u-font-bold u-m-b-32"
          >请创建推广关键词</view
        >
        <view class="u-flex-row u-col-center u-m-b-32">
          <u-input
            v-model.trim="keyword"
            placeholder="请填写4个汉字，不含字母和特殊符号"
          ></u-input>
          <view
            class="u-border-radius u-m-l-16 u-flex-row u-col-center u-row-center"
            style="width: 120rpx; height: 88rpx; background: #408cff"
            @click="handleKeyword"
          >
            <text class="color-text-white u-font-28 u-line-h-44">添加</text>
          </view>
        </view>
        <view
          v-if="keywordList.length"
          class="keyword-pond u-border-radius u-p-32"
        >
          <view
            v-for="(item, index) in keywordList"
            :key="index"
            class="keyword-pond--item u-bg-f u-border-radius u-flex-row u-row-center u-col-center u-p-x-16 u-p-y-8"
          >
            <text class="color-text-less-black u-font-24 u-line-h-40 u-m-r-8">{{
              item
            }}</text>
            <u-icon
              :name="`${static_path}close_circle_grey.png`"
              size="36rpx"
              @click="delKeyword(index)"
            ></u-icon>
          </view>
        </view>
        <view class="u-flex-row u-row-between u-col-center widthAll">
          <text class="color-text-black u-font-24 u-line-h-40">是否视频号发布</text>
          <u-radio-group
            v-model="is_video"
            placement="row"
          >
            <u-radio
              label="是"
              name="1"
              class="u-m-r-32"
            />
            <u-radio
              label="否"
              name="2"
            />
          </u-radio-group>
        </view>
      </view>
      <view
        v-if="!is_view"
        class="widthAll"
        :style="{ height: this.btnHeight + 32 + 'rpx' }"
      ></view>
    </view>
    <BottomBtn
      :data="button_list"
      :buttonIndex="0"
      @submit="handleSubmit"
      @height="getBtnHeight"
    />
    <u-modal
      :show="showModal"
      :showCancelButton="false"
      :showConfirmButton="false"
      confirmText="我知道了"
      width="520rpx"
      :closeOnClickOverlay="false"
    >
      <view class="u-flex-col u-col-center widthAll">
        <view
          class="u-font-bold widthAll u-font-32 u-line-h-48 u-m-b-32 u-text-left"
          >审核失败</view
        >
        <text
          class="u-font-28 u-line-h-44 u-m-b-32 u-text-left widthAll"
          style="color: #3c3c3c"
          >{{ verify_suggest }}</text
        >
        <view
          class="modal-btn widthAll u-border-radius u-p-x-28 u-p-y-20 color-text-white u-text-center"
          style="background: #408cff"
          @click="showModal = false"
          >我知道了</view
        >
      </view>
    </u-modal>
    <base-toast ref="toastRef"></base-toast>
  </view>
</template>

<script>
import { mapGetters } from "vuex";
import MyNavbar from "@/components/my-navbar/index.vue";
import BottomBtn from "@/components/bottom-button/index.vue";
import { getSingKeywordDef } from "../api/detail.js";
import { LIBRARY_VERIFY_STATUS } from "@/utils/mappers/novel.js";
export default {
  props: {},
  components: {
    MyNavbar,
    BottomBtn,
  },
  data() {
    return {
      LIBRARY_VERIFY_STATUS,
      id: null,
      showModal: false,
      is_video: 1,
      keyword: "",
      verify_suggest: "",
      keywordList: [],
      btnHeight: "0",
      submitLoading: false,
      model: {
        book_name: "",
        auth: "",
        book_id: "",
        book_link: "",
        desc: "",
      },
      rules: {
        book_name: [
          { required: true, message: "请输入书籍名称", trigger: "blur" },
        ],
        auth: [{ required: true, message: "请输入作者", trigger: "blur" }],
        book_id: [{ required: true, message: "请输入书籍ID", trigger: "blur" }],
        book_link: [
          { required: true, message: "请输入书籍链接", trigger: "blur" },
        ],
        desc: [{ required: true, message: "请输入书籍简介", trigger: "blur" }],
      },
    };
  },
  computed: {
    ...mapGetters(['static_path', 'image']),
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
  },
  methods: {
    getBtnHeight(height) {
      this.btnHeight = height * 2;
    },

    getDetial() {
      getSingKeywordDef()
        .then((res) => {
          if (res.code == 0) {
            Object.assign(this.model, res.data);
          }
        })
        .catch((error) => {
          this.toastMsg(error, "error");
        })
        .finally(() => {
          uni.stopPullDownRefresh();
        });
    },

    handleSubmit() {
      this.$refs.formRef
        .validate()
        .then(() => {
          const params = {
            ...this.model,
            keywords: this.keywordList,
          };
          this.submitLoading = true;
          console.log(params);
        })
        .catch(() => {});
    },

    handleKeyword() {
      if (this.keywordList.find((el) => el == this.keyword)) {
        return this.toastMsg("关键词已存在", "error");
      }
      this.keywordList.push(this.keyword);
    },

    delKeyword(index) {
      const newList = this.keywordList.splice(index, 1);
      this.keywordList = newList;
    },

    resetPage() {
      this.id = null;
      this.model = this.$options.data().model;
    },

    toastMsg(message, type = "default") {
      this.$refs.toastRef?.show({
        type,
        message,
      });
    },
  },
  onLoad({ id }) {
    this.resetPage();
    this.id = id || null;
    if (id) {
      this.getDetial();
    }
  },
};
</script>

<style lang="scss" scoped>
.prompt-detail-page {
  min-height: 100vh;
}
.keyword-pond {
  display: grid;
  grid-auto-flow: column;
  justify-content: start;
  grid-gap: 16rpx;
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
