export default {
  data() {
    return {
      __IS_TABLE_RESIZE_HEIGHT: true, // 判断是否接受主动计算事件标志
      tableKey: '',
      headHeight: null,
      initialHeight: 70, // 分页h32 + mt8 + table父margin?8 + el-card pb20
    };
  },
  methods: {
    // 监听高度
    handlerHeight() {
      this.$nextTick(() => {
        this.resizeHeight();
        // 监听窗口大小变化
        window.addEventListener('resize', this.resizeHeight, false);
        // 处理主动计算事件
        this.$on('calcTableHeight', this.resizeHeight);
      });
    },
    // 高度变化
    resizeHeight() {
      if (this.$refs[this.tableKey]) {
        const eleId = this.$refs[this.tableKey].$el;
        const { top } = eleId.getBoundingClientRect();
        const ratio = this.getResize();
        const height = Math.max(window.innerHeight - this.initialHeight - top, 300);
        this.headHeight = height;
      }
    },
    getResize() {
      let ratio = 0;
      const ua = navigator.userAgent.toLowerCase();

      if (window.devicePixelRatio !== undefined) {
        ratio = window.devicePixelRatio;
      } else if (~ua.indexOf('msie')) {
        if (screen.deviceXDPI && screen.logicalXDPI) {
          ratio = screen.deviceXDPI / screen.logicalXDPI;
        }
      } else if (window.outerWidth !== undefined && window.innerWidth !== undefined) {
        ratio = window.outerWidth / window.innerWidth;
      }
      return ratio;
    },
  },
  mounted() {
    this.handlerHeight();
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.resizeHeight, false);
    this.$off('calcTableHeight', this.resizeHeight);
  },
};
