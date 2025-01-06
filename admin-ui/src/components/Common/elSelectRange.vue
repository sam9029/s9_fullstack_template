<!--
 * @Author: your name
 * @Date: 2020-05-14 15:26:39
 * @LastEditTime: 2020-05-15 17:55:57
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /ad-dsp-ui-vue/src/components/elSelectRange.vue
 -->
<template>
  <div class="el-select-range">
    <div class="select-range-content" @click="clickContent">
      <span
        :class="[
          msg.includes('请') ? 'range-msg-content-unselected' : 'range-msg-content-selected',
        ]"
        >{{ msg }}</span
      >
      <span
        :class="{
          'el-icon-arrow-down': !display,
          'el-range-icon': true,
          'el-icon-arrow-up': display,
        }"
      ></span>
    </div>
    <div class="select-range-section" v-if="display">
      <p>
        <span>大于</span>
        <span class="el-icon-arrow-right"></span>
        <!-- <el-input v-model="input" placeholder="请输入内容" size="mini"></el-input> -->
        <el-input-number v-model="numObj.gt" controls-position="right" :min="0"></el-input-number>
      </p>
      <p>
        <span>小于</span>
        <span class="el-icon-arrow-left"></span>
        <!-- <el-input v-model="input" placeholder="请输入内容" size="mini"></el-input> -->
        <el-input-number v-model="numObj.lt" controls-position="right" :min="0"></el-input-number>
      </p>
      <span class="icon-triangle icon-triangle-top"></span>
      <span class="icon-triangle icon-triangle-bottom"></span>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'elSelectRange',
    props: {
      numObj: {
        type: Object,
        default: () => ({
          gt: 0,
          lt: 0,
        }),
      },
    },
    data() {
      return {
        msg: '请填写',
        display: false,
      };
    },
    model: {
      prop: 'numObj',
      event: 'changeNum',
    },
    watch: {
      numObj: {
        deep: true,
        immediate: true,
        handler(obj) {
          if (obj.gt && obj.lt) {
            this.msg = `大于${obj.gt}, 小于${obj.lt}`;
          } else if (obj.gt && !obj.lt) {
            this.msg = `大于${obj.gt}`;
          } else if (obj.lt && !obj.gt) {
            this.msg = `小于${obj.lt}`;
          } else {
            this.msg = `请填写`;
          }
        },
      },
    },
    methods: {
      clickContent() {
        this.display = !this.display;
      },
      clickHandler(e) {
        if (!this.$el.contains(e.target)) {
          this.display = false; //点击其他区域关闭
        } else {
          this.display = true;
        }
      },
    },
    created() {},
    mounted() {
      document.addEventListener('click', this.clickHandler);
    },
    beforeDestroy() {
      document.removeEventListener('click', this.clickHandler);
    },
  };
</script>
<style lang="scss" scoped>
  .el-select-range {
    width: 100%;
    height: 36px;
    line-height: 36px;
    color: #666;
    background-color: #fff;
    border-radius: 4px;
    border: 1px solid #d9d9d9;
    box-sizing: border-box;
    position: relative;
    font-size: 12px;
    cursor: pointer;
    .select-range-content {
      width: 100%;
      height: 100%;
      display: flex;
      padding: 0 30px 0 15px;
      justify-content: space-between;
      .el-range-icon {
        right: 10px;
        top: 10px;
        position: absolute;
      }
      .range-msg-content-selected {
        color: #666;
      }
      .range-msg-content-unselected {
        color: #c4c8cf;
      }
    }
    .select-range-section {
      width: 100%;
      position: absolute;
      top: 50px;
      height: 120px;
      padding: 0 30px 0 15px;
      z-index: 9999;
      background-color: #fff;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
      p {
        display: flex;
        justify-content: space-between;
        padding: 10px 0px;
        height: 56px;
        .el-icon-arrow-right,
        .el-icon-arrow-left {
          line-height: 3;
        }
        .el-input-number {
          width: 100px;
        }
        >>> .el-input {
          width: 100px !important;
        }
        // &:first-child {
        //   border-bottom: 1px solid #D9D9D9;
        // }
      }
      .icon-triangle {
        position: absolute;
        left: 25%;
        width: 0;
        height: 0;
      }
      .icon-triangle-top {
        top: -10px;
        border-left: 10px solid transparent;
        border-right: 10px solid transparent;
        border-bottom: 10px solid #d9d9d9;
      }
      .icon-triangle-bottom {
        top: -9px;
        border-left: 10px solid transparent;
        border-right: 10px solid transparent;
        border-bottom: 10px solid #fff;
      }
    }
  }
</style>
