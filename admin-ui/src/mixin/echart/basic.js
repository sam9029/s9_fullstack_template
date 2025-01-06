import echarts from 'echarts';
require('./echartTheme/echartMacarons'); // echarts theme

export default {
  components: {
    SelectRangeNumber: () =>
      import('@/components/Common/SearchPanel/Components/SelectRangeNumber.vue'),
    DescButton: () => import('@/components/DescButton/index.vue'),
    MoreButton: () => import('@/components/MoreButton'),
  },
  props: {
    cardName: {
      type: String,
      default: null,
    },
    echartName: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      chart: null,
      colorData: [],
      flag: true,
      legendData: [],
      seriesData: [],
      setOption: {},
    };
  },
  computed: {
    echartsTheme() {
      return 'echartMacarons';
    },
  },

  mounted() {
    /**
     * 如果示例在初始化时，就已经出现在屏幕上，就直接调用方法
     * 反之，给节点绑定监听事件
     */
    if (this.$el.getBoundingClientRect().top < window.innerHeight) {
      if (this.flag) {
        this.getData();
        this.initChart();
      }
      this.flag = false;
    } else {
      window.addEventListener('scroll', this.scrollHandle, true); // 监听 监听元素是否进入/移出可视区域
    }
  },
  beforeDestroy() {
    window.removeEventListener('scroll', this.scrollHandle, true);

    if (!this.chart) {
      return;
    } else {
      this.chart.dispose();
      this.chart = null;
    }
  },
  methods: {
    initChart() {
      this.$nextTick(() => {
        if (document.getElementById(this.echartName)) {
          this.chart = echarts.init(document.getElementById(this.echartName), this.echartsTheme);
          try {
            this.chart.setOption(this.setOption, true);
          } catch (error) {
            console.error('设置图表配置失败', error);
          }
        }
      });
    },
    scrollHandle() {
      const offset = this.$el.getBoundingClientRect();
      const offsetTop = offset.top;
      const offsetBottom = offset.bottom;

      if (this.flag && offsetTop <= window.innerHeight && offsetBottom >= 0) {
        // console.log(this.$el, "进入可视区域");
        this.getData();
        this.$nextTick(() => {
          this.initChart();
        });
        window.removeEventListener('scroll', this.scrollHandle, true);
        this.flag = false;
      }
    },
  },
};
