<template>
  <u-toast ref="uToast"></u-toast>
</template>

<script>
import { MakeUnifiedOrder, VerifyPaymentResults } from "@/api/pay.js";
import { mapGetters, mapMutations } from "vuex";
import { getPayInfo } from "@/utils/tools";

export default {
  props: {
    collection_id: {
      type: Number,
    },
  },
  data() {
    return {
      out_order_no: "",
      create_timesteamp: null,
    };
  },
  computed: {
    ...mapGetters(["pay_info", "system"]),
  },
  methods: {
    ...mapMutations(["SET_SLEEP_TIME"]),
    async refreshOrder() {
      let now_time = parseInt(new Date().getTime() / 1000);
      if (
        !this.create_timesteamp ||
        !this.out_order_no ||
        now_time - this.create_timesteamp > 300
      )
        return;
      return await VerifyPaymentResults({ out_order_no: this.out_order_no });
    },
    /**
     * @description: 预支付
     * @param {Number} video_ids
     * @return {*}
     */
    async advancePaymentSubmit(params) {
      params = getPayInfo(params);
      // console.log(`params---:`, params);
      uni.showLoading({
        title: "加载中",
      });
      MakeUnifiedOrder(params)
        .then(async (res) => {
          let { byteAuthorization, data, out_order_no, sleep_time } =
            res.data || {};
          this.SET_SLEEP_TIME(sleep_time || 2000);
          this.create_timesteamp = parseInt(new Date().getTime() / 1000);
          this.out_order_no = out_order_no;
          uni.setStorage({
            key:
              params.order_type == 2
                ? `STORAGE_ORDER_CHARGE`
                : `STORAGE_ORDER_DEFAULT_${this.collection_id}`,
            data: JSON.stringify({
              collection_id: this.collection_id,
              time: new Date().getTime() / 1000,
              out_order_no,
            }),
          });
          let originOptions = {
            success: (res) => {
              this.$emit("advancePaymentSuccess", res, this.out_order_no);
            },
            fail: (err) => {
              this.$emit("advancePaymentError", err, this.out_order_no);
            },
            complete: (data) => {
              this.$emit("advancePaymentCompleter", data, this.out_order_no);
            },
          };
          // #ifdef MP-KUAISHOU
          // IOS预支付传参（无UI支付组件）
          if (this.system == "IOS") originOptions.payType = "IAPPurchase";
          ks.pay({ ...originOptions, serviceId: "1", orderInfo: res.data });
          // #endif
          // #ifdef MP-TOUTIAO
          let info = await this.getTTorderId({ data, byteAuthorization });
          tt.getOrderPayment({ ...originOptions, orderId: info.orderId });
          // #endif
          // #ifdef MP-WEIXIN
          wx.requestPayment({ ...originOptions, ...(data || {}) });
          // #endif
        })
        .catch((err) => {
          let message = String(err?.message || err || "预支付失败，请稍后重试！")
          this.$emit("toast", message);
        })
        .finally(() => {
          uni.hideLoading();
        });
    },

    /**
     * @description: 查询支付状态
     * @param {Number} out_order_no
     * @return {*}
     */
    async verifyPaymentSubmit(out_order_no) {
      let params = {
        out_order_no,
      };

      VerifyPaymentResults(params)
        .then((res) => {
          this.$emit("verifyPaymentSuccess", res);
        })
        .catch((err) => {
          this.toast(err.message || "支付结果验证失败，请稍后重试！");
          this.$emit("verifyPaymentError", err.message);
        });
    },
    async getTTorderId(data = {}) {
      return new Promise((resolve, reject) => {
        tt.requestOrder({
          ...data,
          success: (res) => {
            resolve(res);
          },
          fail: (res) => {
            reject(res);
          },
        });
      });
    },

    toast(message, type = "error", complete) {
      this.$refs.uToast?.show({
        type,
        message,
        complete,
        duration: 2000,
      });
    },
  },
};
</script>

<style lang="scss" scoped></style>