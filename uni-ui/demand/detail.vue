<template>
  <view>
    <PromotionPopup
      ref="popupContainer"
      :showWordCode="showWordCode"
      :typeList="typeList"
      :accountList="accountList"
      @completed="onPopupCompleted"
    >
    </PromotionPopup>
    <PromotionTaskPropup
      ref="taskPropup"
      :qrcode="qrcode"
      :scheme="scheme"
      :platformType="platformType"
    >
    </PromotionTaskPropup>
    <u-modal
      :show="showDeleteNotcie"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
      ref="uModal"
      title="温馨提示"
      width="404rpx"
      content="删除后无法恢复，确认删除吗?"
      confirmText="确认删除"
      confirmColor="#408CFF"
      cancelColor="#6A6A6A"
      :showCancelButton="true"
    >
    </u-modal>
    <view class="top-area">
      <MyNavbar :leftIcon="`${static_path}circular_back.png`">
        <template #navbarData>
          <view
            class="u-flex-row u-row-left u-col-center"
            style="margin-left: 16rpx"
          >
            <u-icon
              size="36rpx"
              :name="currentPlatform.platform_icon"
              class="u-m-r-8"
            ></u-icon>
            <text class="u-font-32 color-text-black u-font-bold">{{
              currentPlatform.platform_name
            }}</text>
          </view>
        </template>
      </MyNavbar>
      <view class="card-bg u-m-l-28 u-m-r-28 u-flex-row">
        <u-image
          :src="coverImg"
          width="168rpx"
          height="232rpx"
          shape="square"
          radius="4rpx"
        ></u-image>
        <view class="u-flex-col u-row-between u-m-l-16 u-m-r-24">
          <view class="u-flex-row u-col-center">
            <u-icon size="32rpx" :name="projectIcon" class="u-m-r-8"></u-icon>
            <text class="u-font-28 u-text-main u-line-1 u-font-bold">{{
              name
            }}</text>
          </view>
          <view
            class="u-flex-row u-col-center u-p-l-16 u-p-r-16"
            style="
              border-radius: 8rpx;
              background: #f6f6f6;
              height: 48rpx;
              width: fit-content;
            "
          >
            <text class="u-font-24 color-text-grey u-p-r-8">连载状态</text>
            <u-line
              class="u-p-l-8"
              color="#C6C6C6"
              direction="col"
              length="16rpx"
            ></u-line>
            <text class="u-font-24 color-text-grey u-p-l-8">
              {{ projectStatus }}</text
            >
          </view>
          <view
            class="u-flex-row u-p-l-16 u-p-r-16"
            style="
              border-radius: 8rpx;
              background: #f6f6f6;
              height: 48rpx;
              width: fit-content;
            "
          >
            <u-icon
              size="32rpx"
              :name="`${static_path}icon_plan_mark.png`"
              :label="projectPlanNum"
              labelSize="24rpx"
              labelColor="#585858"
            ></u-icon>
          </view>
          <view
            class="u-flex-row u-col-center"
            style="
              height: 48rpx;
              width: fit-content;
              border-radius: 12rpx;
              border: 1rpx solid #ff7736;
              background: #fff5ee;
            "
          >
            <text class="u-font-24 color-text-orange u-m-r-8 u-m-l-16"
              >我的收益</text
            >
            <u-line color="#C6C6C6" direction="col" length="16rpx"></u-line>
            <text class="u-font-24 u-m-l-8 color-text-orange u-m-r-16">{{
              myIncome
            }}</text>
          </view>
        </view>
      </view>
      <view class="u-flex-row u-m-28" style="justify-content: space-between">
        <view
          v-if="des1T"
          class="u-flex-col u-m-r-16 card-bg"
          style="padding-top: 16rpx; padding-bottom: 16rpx"
        >
          <text class="u-font-bold color-text-black u-font-32 u-line-h-48">{{
            des1
          }}</text>
          <text class="color-text-less-grey u-font-24 u-line-h-40">{{
            des1T
          }}</text>
        </view>
        <view
          v-if="des2T"
          class="u-flex-col card-bg"
          style="padding-top: 16rpx; padding-bottom: 16rpx"
        >
          <text class="u-font-bold color-text-black u-font-32 u-line-h-48">{{
            des2
          }}</text>
          <text class="color-text-less-grey u-font-24 u-line-h-40">{{
            des2T
          }}</text>
        </view>
      </view>
      <view
        class="card-bg u-flex-row u-m-28 u-col-center u-row-between"
        v-show="showSource"
      >
        <view class="u-flex-row u-col-center">
          <u-icon size="72rpx" :name="sourceIcon" class="u-m-r-8"></u-icon>
          <text class="u-m-l-16 u-font-28 u-font-bold u-text-main">{{
            sourceName
          }}</text>
        </view>
        <view>
          <text
            class="u-font-22 color-text-primary u-m-r-16 btn-bg u-line-h-32"
            @click="clipLink()"
            >复制链接</text
          >
          <text
            class="u-font-22 color-text-primary btn-bg u-line-h-32"
            @click="openLink()"
            >直接打开</text
          >
        </view>
      </view>
      <view class="u-m-t-48 u-p-b-28">
        <text class="u-font-bold u-font-32 u-text-main u-m-l-28">
          推广计划</text
        >
      </view>
    </view>
    <view
      :style="{
        paddingLeft: '28rpx',
        paddingRight: '28rpx',
        paddingBottom: `${btnHeight}`,
      }"
    >
      <view
        class="u-flex-col u-col-center"
        style="width: 100%; margin-top: 136rpx"
        v-show="planList.length == 0"
      >
        <u-image
          :src="image.no_data_list"
          width="360rpx"
          height="360rpx"
          shape="square"
        ></u-image>
        <text
          class="u-font-24 color-text-less-grey"
          style="position: relative; bottom: 45px"
          >暂无计划，请点击下方新建按钮</text
        >
      </view>
      <view
        v-for="(item, index) in planList"
        :key="item.id"
        class="card-bg u-m-b-16"
        v-show="planList.length != 0"
      >
        <view
          class="u-flex-row u-col-center u-row-between"
          style="height: 40rpx"
        >
          <view
            class="u-flex-row u-col-center"
            style="background: #f6f6f6; border-radius: 8rpx"
          >
            <u-icon
              size="28rpx"
              :name="item.platform_icon"
              class="u-m-r-8 u-m-l-8"
            ></u-icon>
            <text class="u-line-h-40 u-m-r-8 u-font-20 u-text-main">{{
              item.type_name
            }}</text>
          </view>
          <text
            class="u-m-l-16 u-font-28 u-text-main u-flex-1 u-line-1"
            style="width: 440rpx"
            >{{ item.name }}</text
          >
          <radio
            v-show="isDeletMode"
            :value="item.value"
            :checked="item.isSelected"
            activeBackgroundColor="#408CFF"
            borderColor="#C6C6C6"
            @click="doCheck(item)"
            style="transform: scale(0.6)"
          />
        </view>
        <view
          class="u-flex-row u-m-t-16 u-col-center"
          style="
            border-radius: 12rpx;
            border: 1rpx solid #ff7736;
            background: #fff5ee;
          "
        >
          <view
            class="u-flex-col u-col-center"
            style="padding-top: 16rpx; padding-bottom: 16rpx; flex: 1"
          >
            <text class="u-font-bold u-font-28 u-line-h-44 color-text-orange">{{
              getResult1(item)
            }}</text>
            <text class="u-font-22 u-line-h-40 color-text-orange">{{
              `${item.charge_data ? "支付订单" : "CPM收益"}`
            }}</text>
          </view>
          <u-line color="#C6C6C6" direction="col" length="16rpx"></u-line>
          <view
            v-if="item.charge_data"
            class="u-flex-col u-col-center"
            style="padding-top: 16rpx; padding-bottom: 16rpx; flex: 1"
          >
            <text class="u-font-bold u-font-28 u-line-h-44 color-text-orange">{{
              unitMoney(item.charge_data.charge_price, false, false)
            }}</text>
            <text class="u-font-22 u-line-h-40 color-text-orange"
              >充值金额</text
            >
          </view>
          <u-line
            v-if="item.charge_data && item.cpm_data"
            color="#C6C6C6"
            direction="col"
            length="16rpx"
          ></u-line>
          <view
            v-if="item.charge_data"
            class="u-flex-col u-col-center"
            style="padding-top: 16rpx; padding-bottom: 16rpx; flex: 1"
          >
            <text class="u-font-bold u-font-28 u-line-h-44 color-text-orange">{{
              unitMoney(item.charge_data.total_price, false, false)
            }}</text>
            <text class="u-font-22 u-line-h-40 color-text-orange"
              >CPS预估收益</text
            >
          </view>
          <u-line
            v-if="item.charge_data"
            color="#C6C6C6"
            direction="col"
            length="16rpx"
          ></u-line>
          <view
            v-if="item.charge_data"
            class="u-flex-col u-col-center"
            style="padding-top: 16rpx; padding-bottom: 16rpx; flex: 1"
          >
            <text class="u-font-bold u-font-28 u-line-h-44 color-text-orange">{{
              getResult2(item)
            }}</text>
            <text class="u-font-22 u-line-h-40 color-text-orange">{{
              `${item.cpm_data ? "CPM收益" : "CPS预估收益"}`
            }}</text>
          </view>
          <view
            v-if="!item.charge_data"
            class="u-flex-col u-col-center"
            style="padding-top: 16rpx; padding-bottom: 16rpx; flex: 1"
          >
            <text class="u-font-22 u-line-h-40 color-text-orange">- -</text>
          </view>
        </view>
        <view class="u-m-t-16 u-flex-row u-row-between u-col-center">
          <text class="color-text-less-grey u-font-24 u-line-h-40">{{
            item.create_time
          }}</text>
          <text
            class="u-line-h-40 u-font-24 u-p-l-24 u-p-r-24 u-p-t-4 u-p-b-4 color-text-white"
            @click="doPromotion(item)"
            style="background: #408cff; border-radius: 200rpx"
            >{{ item.button_text }}</text
          >
        </view>
      </view>
      <u-loadmore
        v-if="!listLoading && planList.length > 0"
        :status="status"
        :loading-text="loadingText"
        :loadmore-text="loadmoreText"
        :nomore-text="nomoreText"
      ></u-loadmore>
    </view>
    <BottomBtn
      :data="buttonList"
      :buttonIndex="buttonIndex"
      @delete="deletePlan"
      @height="getBtnHeight"
      @creatPlan="creatPlan"
      @manage="onManage"
      @cancel="onCancel"
    />
    <base-toast ref="toastRef"></base-toast>
  </view>
</template>

<script>
import MyNavbar from "@/components/my-navbar/index.vue";
import BottomBtn from "@/components/bottom-button/index.vue";
import PromotionPopup from "@/components/promotion-popup/index.vue";
import PromotionTaskPropup from "@/components/promotion-popup/promotion-task-popup.vue";
import MescrollMixin from "@/uni_modules/mescroll-uni/components/mescroll-uni/mescroll-mixins.js";
import { mapGetters } from "vuex";
import { copy, unitMoney, throttle, sleep } from "@/utils/tools.js";
import {
  fetchPlanDetail,
  createPlan,
  getMyPlanList,
  deletePlan,
  fetchMyAccount,
} from "./api/index.js";

export default {
  props: {},
  mixins: [MescrollMixin],
  components: {
    MyNavbar,
    BottomBtn,
    PromotionPopup,
    PromotionTaskPropup,
  },
  data() {
    return {
      status: "loadmore",
      loadingText: "努力加载中",
      loadmoreText: "下拉加载更多",
      nomoreText: "没有更多了～",
      isDeletMode: false,
      isEnd: false,
      listLoading: false,
      page: 1,
      pagesize: 20,
      site: null,
      btnHeight: null,
      currentPlatform: {
        advertiser_id: null,
        platform_name: null,
        platform_icon: "",
      },
      relationId: null,
      advertiserType: null,
      contentId: null,
      platformId: null,

      projectIcon: "",
      coverImg: "",
      name: "",
      projectName: "",
      projectStatus: "",
      projectPlanNum: "推广计划：",
      myIncome: "0元",
      showSource: false,
      sourceIcon: "",
      sourceName: "",
      sourceUrl: "",
      showDeleteNotcie: false,
      des1: "",
      des1T: "",
      des2: "",
      des2T: "",
      planList: [],
      selected: [],
      buttonIndex: 0,
      typeList: [],
      accountList: [],
      showWordCode: false,
      qrcode: "",
      scheme: "",
      platformType: 1,
    };
  },
  computed: {
    buttonList() {
      let list = [
        [
          {
            text: "管理",
            shape: "square",
            disabled: this.currentTab == "JUXING" ? true : false,
            plain: true,
            onClick: "manage",
            btnType: "button",
          },
          {
            text: "新建推广计划",
            shape: "square",
            disabled: this.currentTab == "JUXING" ? true : false,
            type: "primary",
            onClick: "creatPlan",
            btnType: "button",
          },
        ],
        [
          {
            text: "取消",
            onClick: "cancel",
            btnType: "icon",
            color: "#1a1a1a",
            name: "close-circle",
          },
          {
            text: this.selected.length
              ? `已选择${this.selected.length}项`
              : "请选择删除项",
            btnType: "text",
          },
          {
            text: "删除",
            onClick: "delete",
            btnType: "icon",
            name: "trash",
            color: "#1a1a1a",
            disabled: this.selected.length == 0 ? true : false,
          },
        ],
      ];
      return list;
    },
    ...mapGetters(["static_path", "image"]),
  },
  watch: {},
  methods: {
    unitMoney,
    getResult1(item) {
      return item.charge_data
        ? item.charge_data.order_num
        : unitMoney(item.cpm_data?.total_price, false, false);
    },
    getResult2(item) {
      return item.cpm_data
        ? unitMoney(item.cpm_data?.total_price, false, false)
        : unitMoney(item.charge_data?.total_price, false, false);
    },
    onPopupCompleted(data) {
      if (data.name.length == 0) {
        uni.navigateTo({
          url: `/pagesUser/account/addAccount?platform_id=${this.platformId}`,
        });
      } else {
        this.generatePlan(data.name, data.id, data.accountId, data.keyword);
      }
    },
    getBtnHeight(height) {
      this.btnHeight = height * 2 + "rpx";
    },
    //生成微信链接
    generateWxUrl: throttle(async function fuc(drama_plan_id) {
      try {
        const res = await postWxUrl({
          drama_plan_id,
        });
        if (res && res.code === 0) {
          this.init();
        }
      } catch (error) {
        this.toastMsg(error.message || error, "error");
      }
    }, 500),
    //创建推广计划
    generatePlan: throttle(async function fuc(
      name,
      type,
      platform_account_primary_id,
      keyword
    ) {
      try {
        let params = {
          relation_id: this.relationId,
          name,
          type,
        };
        if (type == 2) {
          params.platform_account_primary_id;
        }
        if (this.showWordCode) {
          params.keyword;
        }
        const res = await createPlan(params);
        if (res.code === 0) {
          this.toastMsg("创建成功", (type = "success"));
          this.init();
          this.getPlanDetail();
        }
      } catch (error) {
        this.toastMsg(error.message, (type = "error"));
      }
    },
    500),
    //删除推广计划
    doDeletePlan: throttle(async function f() {
      try {
        let params = {
          status: 3,
          ids: this.selected.map((obj) => obj.id),
        };
        console.log(params);
        const res = await deletePlan(params);
        if (res.code === 0) {
          this.toastMsg("删除成功", "success");
          this.buttonIndex = 0;
          this.isDeletMode = false;
          this.selected.length = 0;
          this.init();
        }
      } catch (error) {
        this.toastMsg(error.message, "error");
      }
    }, 500),
    doCheck(item) {
      this.$set(item, "isSelected", !item.isSelected);
      for (let i = 0; i < this.selected.length; i++) {
        if (this.selected[i] === item) {
          this.selected.splice(i, 1);
          return;
        }
      }
      this.selected.push(item);
    },
    confirmDelete() {
      //删除推广计划
      this.showDeleteNotcie = false;
      this.doDeletePlan();
    },
    cancelDelete() {
      this.showDeleteNotcie = false;
      this.buttonIndex = 0;
      this.isDeletMode = false;
      for (let item of this.planList) {
        this.$set(item, "isSelected", false);
      }
      this.selected.length = 0;
    },
    openLink() {
      uni.navigateTo({
        url: `/pages/webView/index?url=${this.sourceUrl}`,
      });
    },
    clipLink() {
      copy(
        {
          content: this.sourceUrl,
        },
        this
      );
    },
    creatPlan() {
      this.$refs.popupContainer.openPopup();
    },
    deletePlan() {
      this.showDeleteNotcie = true;
    },
    doPromotion(item) {
      switch (item.button_type) {
        case 1: // 生成链接
          if (item.type === 5) {
            // 调用微信生成链接
            if (wx_share_info && wx_share_info.article_url) {
              copy(
                {
                  content: item.wx_share_info.article_url,
                },
                this
              );
            } else {
              this.generateWxUrl(item.id);
            }
          }
          break;

        case 2: // 复制链接
          if (item.type === 4) {
            // 复制私域链接
            copy(
              {
                content: item.private_link,
              },
              this
            );
          } else if (item.type === 5) {
            // 复制微信视频号链接
            copy(
              {
                content: item.wx_share_info.article_url,
              },
              this
            );
          }
          break;

        case 3: // 复制口令
          if (item.type === 3) {
            copy(
              {
                content: item.search_code,
              },
              this
            );
          }
          break;

        case 4: // 立即推广
          if (item.type === 1 || item.type === 2) {
            // 唤醒app
            this.scheme = item.publish_info?.schema_url ?? "";
            if (item.publish_info?.show_qr) {
              this.qrcode = item.publish_info?.qr_url ?? "";
            }
            this.platformType = item.platform_id == 2 ? 2 : 1;
            this.$refs.taskPropup.openPopup();
          }
          break;

        case 5: // 保存二维码
          if (item.type === 6) {
            // 获取二维码链接进行展示保存等操作
            this.qrcode = item.qr_link;
            this.$refs.taskPropup.openPopup();
          }
          break;
      }
    },
    onManage() {
      this.buttonIndex = 1;
      this.isDeletMode = true;
    },
    onCancel() {
      this.buttonIndex = 0;
      this.isDeletMode = false;
      for (let item of this.planList) {
        this.$set(item, "isSelected", false);
      }
      this.selected.length = 0;
    },
    init() {
      this.isEnd = false;
      this.getListData();
    },
    onUp() {
      uni.$u.throttle(this.getListData(false), 500);
    },

    onDown() {
      this.isDeletMode = false;
      this.init();
    },
    getPlanDetail() {
      let params = {
        advertiser_type: this.advertiserType,
        platform_id: this.platformId,
        content_id: this.contentId,
      };
      this.toastMsg("加载中", "loading", -1);
      fetchPlanDetail(params)
        .then((res) => {
          if (res.code === 0) {
            this.name = res.data.book_name;
            this.coverImg = res.data.cover_url;
            this.projectName = res.data.advertiser_type_name;
            this.projectIcon = res.data.advertiser_type_icon;
            this.projectPlanNum = `推广计划：${res.data.plan_num}`;
            this.myIncome = res.data.income
              ? `${unitMoney(res.data.income, false)}元`
              : "0元";
            this.projectStatus =
              res.data.serialized_status == 1 ? "已完结" : "连载中";
            this.showSource = res.data.sources.length == 0 ? false : true;
            // this.showSource =true;
            this.sourceName =
              res.data.creative_source == "preview" ? "推广素材" : "网盘素材";
            this.sourceIcon =
              res.data.creative_source == "preview"
                ? `${this.static_path}icon_source_link.png`
                : `${this.static_path}icon_source_pan.png`;

            if (res.data.sources.length != 0) {
              this.sourceUrl = res.data.sources[0].download_url;
            }
            if (res.data.settle_mothods.length) {
              if (res.data.settle_mothods.length > 1) {
                this.des1T = res.data.settle_mothods[0].name;
                this.des1 = res.data.settle_mothods[0].value_format;
                this.des2T = res.data.settle_mothods[1].name;
                this.des2 = res.data.settle_mothods[1].value_format;
              } else {
                this.des2T = res.data.settle_mothods[0].name;
                this.des2 = res.data.settle_mothods[0].value_format;
              }
            }
            this.typeList.length == 0;
            for (let i = 0; i < res.data.mount_list.length; i++) {
              this.typeList.push({
                id: res.data.mount_list[i].id,
                name: res.data.mount_list[i].name,
              });
            }
            this.showWordCode = res.data.self_operated == 1;
          }
        })
        .catch((err) => {
          let message = String(err.message || err || "项目详情获取失败");
          this.toastMsg(message, "error");
        })
        .finally(() => {
          this.$refs.toastRef?.close();
        });
    },
    fetchAccount() {
      let params = {
        platform_id: this.platformId,
      };
      fetchMyAccount(params)
        .then((res) => {
          if (res.code === 0) {
            this.accountList.length = 0;
            if (res.data.list.length > 0) {
              for (const item of res.data.list) {
                this.accountList.push({
                  name: item.platform_account_name,
                  id: item.platform_account_id,
                });
              }
            }
          }
        })
        .catch((err) => {
          let message = String(err.message || err || "获取用户账号失败");
          this.toastMsg(message, "error");
        })
        .finally(() => {});
    },
    getListData(reset = true) {
      if (this.listLoading) return;
      reset && (this.listLoading = true);
      if (!reset && this.isEnd) return;

      if (reset) {
        this.page = 1;
        this.isEnd = false;
      } else {
        this.page += 1;
      }

      this.loadmoreText = `努力加载中`;
      this.status = "loading";

      let params = {
        advertiser_type: this.advertiserType,
        platform_id: this.platformId,
        pagesize: this.pagesize,
        content_id: this.contentId,
        relation_id: this.relationId,
      };
      params.page = this.page;
      this.toastMsg("加载中", "loading", -1);
      getMyPlanList(params)
        .then((res) => {
          const list = res.data.list;
          if (reset) this.planList = list;
          else this.planList.push(...list);
          let bool = !(res.data.list.length < this.pagesize);
          this.isEnd = !bool;
          if (!bool) {
            this.nomoreText = `没有更多了～`;
            this.status = "nomore";
          } else {
            this.loadmoreText = `下拉加载更多`;
            this.status = "loadmore";
          }
          this.site = res.data.site;
        })
        .catch((err) => {
          let message = String(err.message || err || "项目详情获取失败");
          this.toastMsg(message, "error");
        })
        .finally(async () => {
          this.$refs.toastRef?.close();
          uni.stopPullDownRefresh();
          await sleep(300);
          this.listLoading = false;
        });
    },
    // 提示
    toastMsg(message, type = "default", duration = 2000) {
      this.$refs.toastRef?.show({
        type,
        message,
        duration,
      });
    },
  },
  onShow() {
    this.fetchAccount();
  },
  onPullDownRefresh() {
    this.init();
  },
  onReachBottom(e) {
    uni.$u.throttle(this.getListData(), 500);
  },
  onLoad(options) {
    this.advertiserType = options.advertiser_type;
    this.contentId = options.content_id;
    this.platformId = options.platform_id;
    this.relationId = options.relation_id;
    this.getPlanDetail();
    this.init();
    const data = JSON.parse(uni.getStorageSync("SET_JUMP_QUERY"));
    this.currentPlatform = data;
  },
};
</script>

<style lang="scss" scoped>
.top-area {
  /* #ifdef APP || MP */
  padding-top: 88rpx;
  /* #endif */
  width: 750rpx;
  background: #f6f7fb;
}

.card-bg {
  background: #ffffff;
  flex: 1;
  border-radius: 16rpx;
  padding: 28rpx;
}

.btn-bg {
  background: #ecf4ff;
  border-radius: 120rpx;
  padding-top: 8rpx;
  padding-bottom: 8rpx;
  padding-left: 20rpx;
  padding-right: 20rpx;
}
</style>
