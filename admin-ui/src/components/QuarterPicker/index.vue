<template>
  <div class="quarter-picker">
    <mark class="mark" v-show="showSeason" @click.stop="closePicker"></mark>
    <el-input
      placeholder="请选择季度"
      v-model="showValue"
      @focus="focusClick"
      @clear="clearInput"
      clearable
      :style="quarterType === 'quarterRange' ? 'width: 280px;' : 'width: 180px'"
    >
      <i slot="prefix" class="el-input__icon el-icon-date"></i>
    </el-input>
    <el-card
      v-show="showSeason"
      class="picker-box-card"
      :style="quarterType === 'quarterRange' ? 'width: 500px;' : 'width: 250px;'"
    >
      <!-- 范围选择 -->
      <div v-if="quarterType == 'quarterRange'" class="picker-range-container">
        <div class="left-picker">
          <div class="picker-top-area">
            <p>开始年份</p>
            <div class="btn">
              <i class="el-icon-d-arrow-left pointer" @click="prev(1)"></i>
              <span class="yearBtn">{{ currentYear }}</span>
              <i class="el-icon-d-arrow-right pointer" @click="next(1)"></i>
            </div>
          </div>
          <div class="picker-main-area" style="border-right: 1px solid #d3d3d3">
            <p
              ref="pickerLeftItem"
              v-for="(item, index) in pickerLeft"
              :key="index"
              :class="{ actived: isLeftActive(index) }"
              @click="toggerLeftActive(index)"
              >{{ item.label }}</p
            >
          </div>
        </div>
        <div class="right-picker">
          <div class="picker-top-area">
            <p>结束年份</p>
            <div class="btn">
              <i class="el-icon-d-arrow-left pointer" @click="prev(2)"></i>
              <span class="yearBtn">{{ secondYear }}</span>
              <i class="el-icon-d-arrow-right pointer" @click="next(2)"></i>
            </div>
          </div>
          <div class="picker-main-area">
            <p
              ref="pickerRightItem"
              v-for="(item, index) in pickerRight"
              :key="index"
              :class="{
                actived: isRightActive(index),
                disabled: isDisabled(index),
              }"
              @click="toggerRightActive(index)"
              >{{ item.label }}</p
            >
          </div>
        </div>
      </div>
      <!-- 单选 -->
      <div v-else-if="quarterType == 'quarter'" class="picker-radio-container">
        <div class="picker">
          <div class="picker-top-area">
            <div class="btn">
              <i class="el-icon-d-arrow-left pointer" @click="prevRadio"></i>
              <span class="yearBtn">{{ currentYear }}</span>
              <i class="el-icon-d-arrow-right pointer" @click="nextRadio"></i>
            </div>
          </div>
          <div class="picker-main-area">
            <p
              ref="pickerItem"
              v-for="(item, index) in pickerLeft"
              :key="index"
              :class="{ actived: isActiveRadio(index) }"
              @click="toggerRadioActive(index)"
              >{{ item.label }}</p
            >
          </div>
        </div>
      </div>
      <i class="el-icon-circle-close pointer" @click="closePicker"></i>
    </el-card>
  </div>
</template>

<script>
  import moment from 'moment/moment';
  export default {
    props: {
      subValue: {
        type: [String, Array],
      },
      quarterType: {
        type: String,
        default: 'quarterRange',
      },
    },
    data() {
      return {
        showSeason: false,
        showValue: null,
        choseValue: null,
        currentYear: null,
        secondYear: null,
        activeLIndex: null,
        activeRIndex: null,
        pickerLeft: [
          { value: 'Q1', label: '第一季度' },
          { value: 'Q2', label: '第二季度' },
          { value: 'Q3', label: '第三季度' },
          { value: 'Q4', label: '第四季度' },
        ],
        pickerRight: [
          { value: 'Q1', label: '第一季度' },
          { value: 'Q2', label: '第二季度' },
          { value: 'Q3', label: '第三季度' },
          { value: 'Q4', label: '第四季度' },
        ],
      };
    },
    watch: {
      activeLIndex: {
        handler(newVal) {
          if (
            this.quarterType == 'quarterRange' &&
            this.activeRIndex &&
            newVal > this.activeRIndex
          ) {
            this.activeRIndex = null;
          }
        },
      },
    },
    created() {
      // 区间
      if (this.quarterType === 'quarterRange') {
        const startSeason = this.subValue[0].slice(-2);
        const endSeason = this.subValue[1].slice(-2);
        const currentYear = this.subValue[0].slice(0, 4); // 提取开始季度的年份字符串
        const secondYear = this.subValue[1].slice(0, 4); // 提取结束季度的年份字符串
        // 查找季度对应的value的索引
        let lIndex = this.pickerLeft.findIndex((item) => item.value === startSeason);
        let rIndex = this.pickerRight.findIndex((item) => item.value === endSeason);
        // 左侧
        if (lIndex !== -1) {
          // 触发组件点击事件，动态加上actived类
          this.$nextTick(() => {
            this.currentYear = currentYear;
            this.$refs.pickerLeftItem[lIndex].click()
          })
        }
        // 右侧
        if (rIndex !== -1) {
          this.$nextTick(() => {
            this.secondYear = secondYear;
            this.$refs.pickerRightItem[rIndex].click()
          })
        }
        // 单选
      } else if (this.quarterType === 'quarter') {
        const season = this.subValue.slice(-2);
        const currentYear = this.subValue.slice(0, 4); // 提取季度的年份字符串
        let index = this.pickerLeft.findIndex((item) => item.value === season);
        if (index !== -1) {
          // 触发组件点击事件，动态加上actived类
          this.$nextTick(() => {
            this.currentYear = currentYear;
            this.$refs.pickerItem[index].click();
          });
        }
      }
    },
    methods: {
      focusClick() {
        if (!this.currentYear) {
          this.currentYear = new Date().getFullYear();
          this.secondYear = new Date().getFullYear();
        }
        this.showSeason = true;
        this.currentYear = new Date().getFullYear();
        this.secondYear = new Date().getFullYear();
      },

      prev(type) {
        if (this.currentYear && type === 1) {
          this.currentYear -= 1;
        } else if (this.currentYear && type === 2) {
          this.secondYear -= 1;
        }
      },

      next(type) {
        if (this.secondYear && type === 1) {
          this.currentYear += 1;
        } else if (this.secondYear && type === 2) {
          this.secondYear += 1;
        }
      },

      prevRadio() {
        this.currentYear -= 1;
      },

      nextRadio() {
        this.currentYear += 1;
      },

      // 校验值
      toggerFlag() {
        let left = false;
        let right = false;
        if (this.activeLIndex || this.activeLIndex === 0) {
          left = true;
        } else {
          left = false;
        }
        if (this.activeRIndex || this.activeRIndex === 0) {
          right = true;
        } else {
          right = false;
        }
        return { left, right };
      },

      // 区间选中
      toggerLeftActive(index) {
        if (this.activeLIndex == index) {
          this.activeLIndex = null;
        } else {
          this.activeLIndex = index;
        }
        let { left, right } = this.toggerFlag();
        // 两边多选中并且左边不大于右边显示value
        if (left && right && this.activeLIndex <= this.activeRIndex) {
          this.showValue = `${this.currentYear}年${this.pickerLeft[this.activeLIndex].label}—${
            this.secondYear
          }年${this.pickerLeft[this.activeRIndex].label}`;
          if (this.activeLIndex == this.activeRIndex) {
            this.showValue = `${this.currentYear}年${this.pickerLeft[this.activeLIndex].label}`;
          }
        } else {
          this.showValue = null;
        }
        // 两边都选中自动关闭
        if (left && right) {
          this.handleValue();
          this.showSeason = false;
        }
      },
      toggerRightActive(index) {
        if (this.activeRIndex == index) {
          this.activeRIndex = null;
        } else {
          this.activeRIndex = index;
        }
        let { left, right } = this.toggerFlag();
        // 两边多选中并且左边不大于右边显示value
        if (left && right && this.activeLIndex <= this.activeRIndex) {
          this.showValue = `${this.currentYear}年${this.pickerLeft[this.activeLIndex].label}—${
            this.secondYear
          }年${this.pickerLeft[this.activeRIndex].label}`;
          if (this.activeLIndex == this.activeRIndex) {
            this.showValue = `${this.currentYear}年${this.pickerLeft[this.activeLIndex].label}`;
          }
        } else {
          this.showValue = null;
        }
        // 两边都选中自动关闭
        if (left && right) {
          this.handleValue();
          this.showSeason = false;
        }
      },

      // 单选选中
      toggerRadioActive(index) {
        if (this.activeLIndex == index) {
          this.activeLIndex = null;
        } else {
          this.activeLIndex = index;
        }
        let { left } = this.toggerFlag();
        if (left) {
          this.showValue = `${this.currentYear}年${this.pickerLeft[this.activeLIndex].label}`;
          this.handleValue();
          this.showSeason = false;
        } else {
          this.showValue = null;
        }
      },
      // 单选
      isActiveRadio(index) {
        return this.activeLIndex === index;
      },

      close() {
        this.clearInput();
        this.showValue = null;
        this.showSeason = false;
      },

      // 处理最后的选中值
      handleValue(flag = false) {
        // 第一季度 1月-3月 | 第二季度4月-6月 | 第三季度 7月-9月 | 第四季度 10月-12月
        if (flag) {
          this.choseValue = null;
          this.$emit('change', this.choseValue);
        } else {
          if (this.quarterType === 'quarterRange') {
            this.choseValue = [
              `${this.currentYear}-${this.pickerLeft[this.activeLIndex].value}`,
              `${this.secondYear}-${this.pickerLeft[this.activeRIndex].value}`,
            ];
          } else if (this.quarterType === 'quarter') {
            this.choseValue = `${this.currentYear}-${this.pickerLeft[this.activeLIndex].value}`;
          }
          this.$emit('change', this.choseValue);
        }
      },

      // 区间
      isLeftActive(index) {
        return this.activeLIndex === index;
      },
      isRightActive(index) {
        return this.activeRIndex === index;
      },

      // 置灰
      isDisabled(index) {
        if (this.activeLIndex && this.activeLIndex > index) {
          return true;
        } else {
          return false;
        }
      },

      // 清空el-input时
      clearInput() {
        this.activeLIndex = null;
        this.activeRIndex = null;
        this.choseValue = [];
        this.currentYear = null;
        this.secondYear = null;
        this.handleValue(true);
      },

      // 关闭遮罩
      closePicker() {
        const { left, right } = this.toggerFlag();
        const isQuarterRange = this.quarterType === 'quarterRange';
        if ((isQuarterRange && left && right) || (!isQuarterRange && left)) {
          this.showSeason = false;
        } else {
          this.close();
        }
      },
    },
  };
</script>
<style lang="scss" scoped>
  .picker-box-card {
    margin-top: 10px;
    position: fixed;
    z-index: 9999;
    .picker-range-container {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      .left-picker,
      .right-picker {
        .picker-top-area {
          padding-bottom: 10px;
          border-bottom: 1px solid #d3d3d3;
          p {
            text-align: center;
            margin-bottom: 10px;
          }
          .btn {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
            font-size: 16px;
          }
          .yearBtn {
            color: #409eff;
          }
        }
        .picker-main-area {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          grid-gap: 20px;
          padding: 20px;
          p {
            text-align: center;
            cursor: pointer;
            padding: 5px;
          }
        }
      }
    }
    .picker-radio-container {
      .picker {
        .picker-top-area {
          padding-bottom: 10px;
          border-bottom: 1px solid #d3d3d3;
          p {
            text-align: center;
            margin-bottom: 10px;
          }
          .btn {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
            font-size: 16px;
          }
          .yearBtn {
            color: #409eff;
          }
        }
        .picker-main-area {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          grid-gap: 20px;
          padding: 20px;
          p {
            text-align: center;
            cursor: pointer;
            padding: 5px;
            border-radius: 10px;
            transition: all 0.3s ease-in-out;
            &:hover {
              background-color: #9bcdff;
              color: #ffffff;
            }
          }
        }
      }
    }
    .el-icon-circle-close {
      position: absolute;
      top: 10px;
      right: 10px;
      font-size: 16px;
    }
  }
  .mark {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0);
    z-index: 999;
  }
  .actived {
    border-radius: 10px;
    background-color: #409eff;
    color: #ffffff;
  }
  .disabled {
    pointer-events: none;
    opacity: 0.6;
    cursor: not-allowed;
    background-color: #f5f7fa;
    color: #c0c4cc;
    border-color: #e4e7ed;
    border-radius: 10px;
  }
</style>
