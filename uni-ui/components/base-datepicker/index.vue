<template>
  <view class="base-datepicker">
    <view
      v-if="baseBtn"
      class="filter-btn u-flex-row u-row-center u-col-center u-border-radius u-p-16"
      :class="{
        'filter-btn--active':
          store_date.length == 2 || currentBtn.value == null,
      }"
      :style="{ height: btnHeight }"
      @click="switchComps"
    >
      <text class="u-m-r-8 u-nowrap u-font-24 u-lin-h-40">{{
        currentBtn.label
      }}</text>
      <u-icon
        name="arrow-down"
        size="32rpx"
        :color="arrowDownColor"
        style="position: relative; top: 2rpx"
      ></u-icon>
    </view>
    <view v-else class="filter-btn--custom">
      <slot :label="currentBtn.label" :value="currentBtn.value"></slot>
    </view>
    <u-popup :show="showSelect" round="24rpx">
      <view class="u-p-28" style="display: grid; grid-gap: 32rpx">
        <view class="select-top u-flex-row u-row-between u-col-center">
          <text class="u-font-bold u-font-32 u-line-h-48">{{ title }}</text>
          <u-icon
            :name="`${static_path}close_circle_grey.png`"
            size="48rpx"
            @click="closeComps"
          ></u-icon>
        </view>
        <view v-if="type.includes('quick')" class="date-btns">
          <view
            v-for="item in dateList"
            :key="item.value"
            class="date-btns--item u-border-radius u-flex-row u-row-center u-col-center"
            :class="{ 'date-btns--active': item.value == currentBtn.value }"
            @click="chooseDate(item)"
          >
            <text class="u-font-24 u-line-h-40">{{ item.label }}</text>
          </view>
        </view>
        <view v-if="type.includes('custom')">
          <view class="color-text-less-black u-font-28 u-line-h-44 u-m-y-28"
            >自定义查询</view
          >
          <view
            class="select-date u-border-radius u-p-16 widthAll"
            :class="{ 'select-date--active': store_date.length == 2 }"
          >
            <text
              class="select-date--item"
              :class="{ 'error-tip': !startValid }"
              @click="openDatePicker(0)"
              >{{ store_date[0] || "开始时间" }}</text
            >
            <text class="select-date--item">—</text>
            <text
              class="select-date--item"
              :class="{ 'error-tip': !endValid }"
              @click="openDatePicker(1)"
              >{{ store_date[1] || "结束时间" }}</text
            >
          </view>
        </view>
        <view v-if="type.every((t) => t === 'list')" class="list-btn">
          <view
            v-for="item in listBtns"
            :key="item.value"
            class="u-flex-row u-row-center u-col-center u-p-16 u-border-radius"
            :class="{
              'list-btn--default': item.value != currentBtn.value,
              'list-btn--active': item.value == currentBtn.value,
            }"
            @click="chooseListItem(item)"
          >
            <text class="u-font-24 u-line-h-40">{{ item.label }}</text>
          </view>
        </view>
        <view v-if="showBottomBtns" class="bottom-btns u-m-t-64">
          <view
            class="u-flex-row u-row-center u-col-center"
            style="border-right: 2rpx solid #eeeeee; width: 346rpx"
          >
            <text class="u-font-28 color-text-less-grey" @click="cancelComps"
              >取消</text
            >
          </view>
          <text class="u-font-28 color-text-primary" @click="beforeSubmit"
            >确定</text
          >
        </view>
      </view>
    </u-popup>
    <u-datetime-picker
      :show="showStartDatePicker"
      v-model="startDate"
      mode="date"
      @cancel="closeStart"
      @confirm="confirmStart"
    ></u-datetime-picker>
    <u-datetime-picker
      :show="showEndDatePicker"
      v-model="endDate"
      mode="date"
      @cancel="closeEnd"
      @confirm="confirmEnd"
    ></u-datetime-picker>
    <base-toast ref="toastRef"></base-toast>
  </view>
</template>

<script>
import { mapGetters } from "vuex";
// 展示区域可通过插槽自定义样式，需要配置属性baseBtn
export default {
  props: {
    title: {
      type: String,
      default: "标题",
    },
    btnHeight: {
      type: String,
      default: "72rpx",
    },
    // 是否展示默认按钮
    baseBtn: {
      type: Boolean,
      default: true,
    },
    type: {
      type: Array,
      default: ["quick", "custom"], // custom-展示便捷按钮/自定义筛选 quick-展示便捷按钮 list-只展示列表按钮
    },
    // 是否展示底部按钮
    showBottomBtns: {
      type: Boolean,
      default: true,
    },
  },
  components: {},
  data() {
    return {
      showSelect: false,
      showStartDatePicker: false,
      showEndDatePicker: false,
      isEditing: false,
      currentBtn: {
        label: "近三月",
        value: "3months",
      },
      startDate: "",
      endDate: "",
      startValid: true,
      endValid: true,
      store_date: [],
      submit_date: [],
      listBtns: [
        {
          label: "全部",
          value: null,
        },
        {
          label: "近三月",
          value: "3months",
        },
        {
          label: "近半年",
          value: "6months",
        },
        {
          label: "近一年",
          value: "12months",
        },
      ],
      dateList: [
        {
          label: "今日",
          value: "today",
        },
        {
          label: "昨日",
          value: "yesterday",
        },
        {
          label: "近三日",
          value: "3days",
        },
        {
          label: "近七日",
          value: "7days",
        },
        {
          label: "本周",
          value: "week",
        },
        {
          label: "上周",
          value: "lastweek",
        },
        {
          label: "本月",
          value: "month",
        },
        {
          label: "上月",
          value: "lastmonth",
        },
        {
          label: "近三月",
          value: "3months",
        },
      ],
    };
  },
  computed: {
    ...mapGetters(['static_path']),
    arrowDownColor() {
      if (this.store_date.length == 2 || this.currentBtn.value == null) {
        return "#408CFF";
      } else {
        return "#3c3c3c";
      }
    },
  },
  methods: {
    /**
     * @description: 设置日期
     * @param {String} value
     * @param {Boolean} needReturn - 是否需要直接返回日期数组
     * @return {*}
     */
    setDate(value, needReturn = false) {
      const newList = [...this.listBtns, ...this.dateList];
      this.currentBtn =
        newList.find((item) => item.value === value) || this.currentBtn;
      this.formatDate(value);
      if (needReturn) {
        this.$emit("submit", this.submit_date, this.currentBtn);
      }
    },

    /**
     * @description: 切换日期选择组件的显示状态
     * @return {*}
     */
    switchComps() {
      this.showSelect = !this.showSelect; // 反转组件显示状态
    },

    /**
     * @description: 关闭日期选择组件
     * @return {*}
     */
    closeComps() {
      this.showSelect = false; // 将组件状态设置为隐藏
    },

    /**
     * @description: 打开日期选择器
     * @param {*} index - 选择器的索引，0为开始日期，1为结束日期
     * @return {*}
     */
    openDatePicker(index) {
      this.showSelect = false; // 关闭选择组件
      if (index === 0) {
        this.showEndDatePicker = false; // 关闭结束日期选择器
        this.showStartDatePicker = true; // 打开开始日期选择器
      } else {
        this.showStartDatePicker = false; // 关闭开始日期选择器
        this.showEndDatePicker = true; // 打开结束日期选择器
      }
    },

    /**
     * @description: 关闭开始日期选择器
     * @return {*}
     */
    closeStart() {
      this.showStartDatePicker = false; // 隐藏开始日期选择器
      this.showSelect = true; // 显示选择组件
    },

    /**
     * @description: 关闭结束日期选择器
     * @return {*}
     */
    closeEnd() {
      this.showEndDatePicker = false; // 隐藏结束日期选择器
      this.showSelect = true; // 显示选择组件
    },

    /**
     * @description: 清空当前选择的日期按钮
     * @return {*}
     */
    clearDateBtn() {
      this.currentBtn = {
        label: "",
        value: "",
      }; // 重置当前按钮
    },

    /**
     * @description: 重置自定义日期选择
     * @return {*}
     */
    resetCustomDate() {
      this.startDate = ""; // 清空开始日期
      this.endDate = ""; // 清空结束日期
      this.startValid = true; // 重置开始日期有效标志
      this.endValid = true; // 重置结束日期有效标志
      this.date = []; // 清空日期数组
    },

    /**
     * @description: 返回时间处理
     * @param {*} flag - 日期标识
     * @return {*}
     */
    formatDate(flag) {
      const today = new Date(); // 获取当前日期
      switch (flag) {
        case "today":
          this.submit_date = [
            uni.$u.timeFormat(today, "yyyy.mm.dd"), // 设置为今天的日期
            uni.$u.timeFormat(today, "yyyy.mm.dd"),
          ];
          break;
        case "yesterday":
          const yesterday = new Date(today); // 获取昨天的日期
          yesterday.setDate(today.getDate() - 1);
          this.submit_date = [
            uni.$u.timeFormat(yesterday, "yyyy.mm.dd"),
            uni.$u.timeFormat(yesterday, "yyyy.mm.dd"),
          ];
          break;
        case "3days":
          const threeDaysAgo = new Date(today); // 复制当前日期
          this.submit_date = [
            uni.$u.timeFormat(
              new Date(threeDaysAgo.setDate(threeDaysAgo.getDate() - 2)), // 设置为3天前的日期
              "yyyy.mm.dd"
            ),
            uni.$u.timeFormat(today, "yyyy.mm.dd"),
          ];
          break;
        case "7days":
          const sevenDaysAgo = new Date(today); // 复制当前日期
          this.submit_date = [
            uni.$u.timeFormat(
              new Date(sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)), // 设置为7天前的日期
              "yyyy.mm.dd"
            ),
            uni.$u.timeFormat(today, "yyyy.mm.dd"),
          ];
          break;
        case "week":
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay()); // 获取本周开始日期
          this.submit_date = [
            uni.$u.timeFormat(weekStart, "yyyy.mm.dd"),
            uni.$u.timeFormat(today, "yyyy.mm.dd"),
          ];
          break;
        case "lastweek":
          const lastWeekStart = new Date(today);
          lastWeekStart.setDate(today.getDate() - today.getDay() - 7); // 获取上周开始日期
          const lastWeekEnd = new Date(today);
          lastWeekEnd.setDate(today.getDate() - today.getDay() - 1); // 获取上周结束日期
          this.submit_date = [
            uni.$u.timeFormat(lastWeekStart, "yyyy.mm.dd"),
            uni.$u.timeFormat(lastWeekEnd, "yyyy.mm.dd"),
          ];
          break;
        case "month":
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1); // 获取本月开始日期
          this.submit_date = [
            uni.$u.timeFormat(monthStart, "yyyy.mm.dd"),
            uni.$u.timeFormat(today, "yyyy.mm.dd"),
          ];
          break;
        case "lastmonth":
          const lastMonthStart = new Date(
            today.getFullYear(),
            today.getMonth() - 1,
            1 // 获取上月开始日期
          );
          const lastMonthEnd = new Date(
            today.getFullYear(),
            today.getMonth(),
            0 // 获取上月结束日期
          );
          this.submit_date = [
            uni.$u.timeFormat(lastMonthStart, "yyyy.mm.dd"),
            uni.$u.timeFormat(lastMonthEnd, "yyyy.mm.dd"),
          ];
          break;
        case "3months":
          const threeMonthsAgo = new Date(
            today.getFullYear(),
            today.getMonth() - 3,
            today.getDate()
          );
          if (threeMonthsAgo.getDate() !== today.getDate()) {
            threeMonthsAgo.setDate(0);
          }
          this.submit_date = [
            uni.$u.timeFormat(threeMonthsAgo, "yyyy.mm.dd"),
            uni.$u.timeFormat(today, "yyyy.mm.dd"),
          ];
          break;
        case "6months":
          const sixMonthsAgo = new Date(
            today.getFullYear(),
            today.getMonth() - 6,
            today.getDate()
          );
          if (sixMonthsAgo.getDate() !== today.getDate()) {
            sixMonthsAgo.setDate(0);
          }
          this.submit_date = [
            uni.$u.timeFormat(sixMonthsAgo, "yyyy.mm.dd"),
            uni.$u.timeFormat(today, "yyyy.mm.dd"),
          ];
          break;
        case "12months":
          const yearStart = new Date(today);
          yearStart.setMonth(today.getMonth() - 12); // 获取12个月前日期
          this.submit_date = [
            uni.$u.timeFormat(yearStart, "yyyy.mm.dd"),
            uni.$u.timeFormat(today, "yyyy.mm.dd"),
          ];
          break;
        default:
          this.submit_date = []; // 默认情况下清空提交的日期
      }
      const newDate = this.submit_date.map((el) => el.replace(/\./g, "-"));
      this.submit_date = newDate;
    },

    /**
     * @description: 选择日期并设置相应的值
     * @param {*} item - 选择的日期项
     * @return {*}
     */
    chooseDate(item) {
      this.resetCustomDate(); // 重置自定义日期
      this.currentBtn = item; // 设置当前选择的按钮
      this.formatDate(item.value);
    },

    /**
     * @description: 确认开始日期的选择
     * @param {*} value - 选中的日期值
     * @return {*}
     */
    confirmStart({ value }) {
      this.startValid = true; // 设置开始日期有效
      this.clearDateBtn(); // 清空当前按钮
      this.store_date[0] = uni.$u.timeFormat(new Date(value), "yyyy.mm.dd"); // 保存选择的开始日期
      this.showStartDatePicker = false; // 关闭开始日期选择器
      this.showSelect = true; // 显示选择组件
    },

    /**
     * @description: 确认结束日期的选择
     * @param {*} value - 选中的日期值
     * @return {*}
     */
    confirmEnd({ value }) {
      this.endValid = true; // 设置结束日期有效
      this.clearDateBtn(); // 清空当前按钮
      this.store_date[1] = uni.$u.timeFormat(new Date(value), "yyyy.mm.dd"); // 保存选择的结束日期
      this.showEndDatePicker = false; // 关闭结束日期选择器
      this.showSelect = true; // 显示选择组件
    },

    /**
     * @description: 提交前的有效性检查
     * @return {*}
     */
    submitValid() {
      if (!this.type.every((t) => t === "list")) {
        if (!this.startDate && !this.endDate) {
          this.startValid = false; // 开始日期无效
          this.endValid = false; // 结束日期无效
          return this.toastMsg("请选择查询时间段", "error"); // 提示信息
        }
        if (!this.startDate) {
          this.startValid = false; // 开始日期无效
          return this.toastMsg("请选择开始时间", "error"); // 提示信息
        }
        if (!this.endDate) {
          this.endValid = false; // 结束日期无效
          return this.toastMsg("请选择结束时间", "error"); // 提示信息
        }
        this.currentBtn.label = "自定义"; // 标记为自定义按钮
        this.currentBtn.value = "custom"; // 设置按钮值
      }
    },

    /**
     * @description: 提交数据前的检查和处理
     * @return {*}
     */
    beforeSubmit() {
      if (this.currentBtn.value) {
        this.submitComps(); // 如果按钮值存在，则直接提交
      } else {
        this.submitValid(); // 验证日期有效性
        this.submit_date = JSON.parse(JSON.stringify(this.store_date)).map((el) => el.replace(/\./g, "-")); // 复制存储的日期值
        this.submitComps(); // 提交数据
      }
    },

    /**
     * @description: 提交选择的日期
     * @return {*}
     */
    submitComps() {
      this.showSelect = false; // 关闭选择组件
      this.$emit("submit", this.submit_date, this.currentBtn);
    },

    cancelComps() {
      this.submit_date = [];
      this.store_date = [];
      this.showSelect = false; // 关闭选择组件
    },

    /**
     * @description: list模式下点击按钮直接返回结果
     * @param {*} item
     * @return {*} submit_date-输出时间, item-当前选中
     */
    chooseListItem(item) {
      this.resetCustomDate(); // 重置自定义日期
      this.currentBtn = item; // 设置当前选择的按钮
      this.formatDate(item.value);
      if (!this.showBottomBtns) {
        this.showSelect = false; // 关闭选择组件
        this.$emit("submit", this.submit_date, item);
      }
    },

    toastMsg(message, type = "default") {
      this.$refs.toastRef?.show({
        type,
        message,
      });
    },
  },
	mounted() {
		this.setDate('3months', true)
	}
};
</script>

<style lang="scss" scoped>
.filter-btn {
  min-width: 144rpx;
  color: #3c3c3c;
  background: #f6f6f6;
}

.filter-btn--active {
  background: #ecf4ff !important;
  color: $u-primary;
}

.date-btns {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-gap: 16rpx;

  &--item {
    color: #3c3c3c;
    height: 72rpx;
    background: #f6f6f6;
  }

  &--active {
    height: 72rpx;
    color: $u-primary !important;
    background: #ecf4ff !important;
  }
}

.select-date {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  justify-items: center;
  align-items: center;
  background: #f6f6f6;

  &--item {
    color: #3c3c3c;
    font-size: 24rpx;
    line-height: 40rpx;
  }
}

.select-date--active {
  background: #ecf4ff !important;

  .select-date--item {
    color: $u-primary !important;
  }
}

.bottom-btns {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  justify-items: center;
  align-items: center;
}

.select-date .error-tip {
  color: #ff325b !important;
  animation: shake 0.8s ease-in-out;
}

.list-btn {
  display: grid;
  grid-gap: 16rpx;

  &--default {
    background: #f6f6f6;
    color: #3c3c3c;
  }

  &--active {
    background: #ecf4ff;
    color: $u-primary;
  }
}

@keyframes shake {
  0% {
    transform: translate(0, 0) rotate(0deg);
  }

  10% {
    transform: translate(-4rpx, 0) rotate(-3deg);
  }

  20% {
    transform: translate(4rpx, 0) rotate(3deg);
  }

  30% {
    transform: translate(-4rpx, 0) rotate(-3deg);
  }

  40% {
    transform: translate(4rpx, 0) rotate(3deg);
  }

  30% {
    transform: translate(-4rpx, 0) rotate(-3deg);
  }

  60% {
    transform: translate(4rpx, 0) rotate(3deg);
  }

  70% {
    transform: translate(-4rpx, 0) rotate(-3deg);
  }

  80% {
    transform: translate(4rpx, 0) rotate(3deg);
  }

  90% {
    transform: translate(-4rpx, 0) rotate(-3deg);
  }

  100% {
    transform: translate(0, 0) rotate(0deg);
  }
}
</style>
