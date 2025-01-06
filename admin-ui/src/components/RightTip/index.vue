<template>
  <div class="rigth-tip-contianer">
    <div class="right-tip" v-drag="{ top: true, left: false }">
      <ul>
        <li v-for="tip in tips" :key="tip.key" @click="handleEv(tip.key)" @mouseenter="enterEle" @mouseleave="leaveEle">
          <span class="tip-icon" :class="tip.icon"></span>
          <span class="tip-text">{{ tip.text }}</span>
          <span v-if="tip.badget" class="tip-count">{{ tip.count }}</span>
        </li>
      </ul>
    </div>

    <ExportLog :visible.sync="exportVisible"></ExportLog>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import RightTipEmitter from './evbus'

export default {
  components: {
    ExportLog: () => import('./ExportLog'),
  },
  data() {
    return {
      tips: [
        {
          icon: 'el-icon-download',
          text: '导出记录',
          key: 'export',
          badget: false,
          count: 0
        }
      ],
      exportVisible: false,
      exportNum: 0,
    };
  },
  created() {
    RightTipEmitter.on('export-log', this.slowShowExport);
  },
  mounted() {
    this.queryTipsCount();
  },
  beforeDestroy() {
    RightTipEmitter.off('export-log', this.slowShowExport);
  },
  methods: {
    enterEle(ele) {
      ele.target.classList.add('tip-selected');
    },
    leaveEle(ele) {
      ele.target.classList.remove('tip-selected');
    },
    handleEv(key) {
      switch(key) {
        case 'export':
          return this.showExport();
        default:
          console.log('unkown key', key);
      }
    },
    slowShowExport() {
      setTimeout(() => {
        this.exportVisible = true;
      }, 800);
    },
    showExport() {
      this.exportVisible = true;
    },
    queryTipsCount() {
      this.queryExportCount();
    },
    queryExportCount() {
      this.setTipCount('export', 1);
    },
    setTipCount(key, count) {
      this.tips.forEach(tip => {
        if (tip.key == key) {
          tip.count = count;
        }
      })
    }
  },
};
</script>

<style lang="scss">
$bgColor: rgb(122, 110, 110);
.right-tip {
  position: fixed;
  z-index: 9999;
  top: 50%;
  right: 0;
  cursor: pointer;
  // background-color: #ccc;
  ul {
    display: flex;
    flex-direction: column;
    li {
      position: relative;
      width: 35px;
      height: 35px;
      margin-bottom: 5px;
      cursor: pointer;
      background-color: $bgColor;
      color: rgb(102, 102, 102);
      display: inline-block;
      border-radius: 3px 0px 0px 3px;
      font: 12px / 150% Arial, Verdana, 宋体;
      background-repeat: no-repeat;
      .tip-icon {
        font-size: 20px;
        color: #fff;
        padding: 8px;
      }
      .tip-text {
        width: 62px;
        height: 35px;
        line-height: 35px;
        color: rgb(255, 255, 255);
        text-align: center;
        font-family: 微软雅黑;
        position: absolute;
        z-index: 1;
        left: 35px;
        top: 0px;
        background-color: $bgColor;
        font-style: normal;
        cursor: pointer;
        border-radius: 3px 0px 0px 3px;
        transition: left 0.3s ease-in-out 0.1s;
        margin: 0px;
        padding: 0px;
      }
      .tip-count {
        position: absolute;
        z-index: 3;
        right: 0px;
        top: -5px;
        border-radius: 10px;
        color: #fff;
        font-size: 12px;
        height: 16px;
        line-height: 16px;
        padding: 0 5px;
        text-align: center;
        white-space: nowrap;
        background-color: var(--theme-default);
      }
    }
    .tip-selected {
      background-color: var(--theme-default);
      .tip-text {
        left: -60px;
        background-color: var(--theme-default);
      }
      .tip-count {
        background-image: none;
        background-color: #fff;
        color: var(--theme-default);
      }
    }
  }
}
</style>