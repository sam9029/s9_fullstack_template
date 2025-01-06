<template>
  <div ref="inputAreaWrapperRef" class="multi-line-textarea__wrapper" :style="textareaWrapperStyle">
    <!-- 行数列 -->
    <textarea cols="1" id="lineEl" ref="lineRef" disabled>1</textarea>

    <!-- 
      输入框
      wrap="off": 超出 cols 宽度的不会换行，此时 <textarea> 将变为水平可滚动。
     -->
    <textarea
      wrap="off"
      id="inputAreaEl"
      ref="inputAreaRef"
      v-model="textValue"
      :style="textareaStyle"
      :placeholder="placeholder"
      oncontextmenu="return false"
      @keyup="handleKeyUp($event)"
      @focus="handleFocus($event)"
      @blur="handleBlur($event)"
      @scroll="handleScroll($event)"
    ></textarea>
  </div>
</template>

<script>
  /** 监听输入元素变化对象 */
  let resizeObserver = null;

  export default {
    props: {
      // 父子数据同步
      modelValue: {
        type: [Array],
        default: () => [],
      },
      // 返回的数据类型--暂时仅Array类型支持，后续可以探讨String类型返回
      needDataType: {
        type: String,
        default: 'Array',
        validator: function (value) {
          return ['Array'].includes(value);
        },
      },
      // 列宽
      width: {
        type: [Number, String],
        default: 600,
      },
      //行高
      height: {
        type: [Number, String],
        default: 200,
      },
      // 禁止拖动 teatarea调整大小
      resize: {
        type: Boolean,
        default: true,
      },
      // 提示备注
      placeholder: {
        type: String,
        default: '请输入内容',
      },
      // 开启动画滚动同步--作用见函数 autoScroll
      openDomAnimeFrame: {
        type: Boolean,
        default: false,
      },
    },

    model: {
      prop: 'modelValue',
      event: 'change',
    },

    computed: {
      textareaWrapperStyle() {
        return {
          width: this.width + 'px',
          height: this.height + 'px',
        };
      },
      textareaStyle() {
        let style = { resize: 'auto' }; // 展示拖动调整
        // 禁止展示拖动调整
        if (!this.resize) style.resize = 'none';

        return style;
      },
    },

    data() {
      return {
        textValue: '',
        lineNum: '', // 字符串格式，用于左侧数据行数展示
      };
    },

    methods: {
      handleUpdateData: _.debounce(function () {
        /** 获取数据并除空 */
        const modelValue = arrayTrim(this.useModelData());
        this.$emit('change', modelValue);
      }, 500),

      /**
       * 处理父子同步的modelvalue数据
       * @param {String} _type 需要将数据处理何种数据类型
       */
      useModelData(_type = 'Array') {
        let modelValue = null;

        if (_type === 'Array') {
          modelValue = [];
          let str = JSON.parse(JSON.stringify(this.textValue));

          /**
           * windows平台  `\r\n` 才会换行
           * \r：表示回车，回到当前行的行首，而不会换到下一行，如果接着输出的话，本行以前的内容会被逐一覆盖（光标在该行的头部）
           * \r\n：表示换行，换到当前位置的下一行（光标在下一行的头部）
           */
          str = str.replace(/\r/gi, '');
          // 拆分成数组
          modelValue = str.split('\n');
        }

        return modelValue;
      },

      /** 失焦更新数据 */
      handleFocus(_el) {
        this.handleUpdateData();
      },

      /** 聚焦更新数据 */
      handleBlur(_el) {
        this.handleUpdateData();
      },

      handleScroll(_el) {
        this.$refs.lineRef.scrollTop = _el.target.scrollTop;
      },

      /** 按回车
       * - 更新行数
       * - 更新数据
       **/
      handleKeyUp(_el) {
        // \r 回车  \n 换行  \t 制表
        let line = 1;
        let modelValue = this.useModelData();
        line = modelValue.length;
        this.useLine(line);
        this.handleUpdateData();
      },

      /**
       * 计算行数
       */
      useLine(n = 1) {
        if (!this.$refs.lineRef) return;
        for (var i = 1; i <= n; i++) {
          if (document.all) {
            // 非IE
            this.lineNum += i + '\r\n';
          } else {
            // 非IE
            this.lineNum += i + '\n';
          }
        }

        this.$refs.lineRef.value = this.lineNum;
        this.lineNum = '';
      },

      /**
       * 监听输入框textarea元素视图变化并同步修改 lineEl 元素的高度
       */
      useTextAreaElResize() {
        this.$nextTick(() => {
          const wrapperRef = this.$refs?.inputAreaWrapperRef;
          const inputAreaEl = this.$refs?.inputAreaRef;
          const lineEl = this.$refs?.lineRef;

          if (!inputAreaEl || !lineEl || !wrapperRef) return;

          resizeObserver = new ResizeObserver((entries) => {
            let new_wrapper_height = this.height;

            // 数组只会有一个元素，只监听了输入框textarea
            for (const entry of entries) {
              if (entry.target.offsetHeight) {
                new_wrapper_height = entry.target.offsetHeight;
              }
            }
            wrapperRef.style.height = new_wrapper_height + 'px';
          });

          // 监听输入框的变化
          resizeObserver.observe(inputAreaEl);
        });
      },

      /**
       * 采用JS提供的画面绘制流程API，使得行号列与输入框同步滚动更加丝滑
       * textarea 的 onscroll="G('lineEl').scrollTop = this.scrollTop;" 的平替（但不兼容IE）
       */
      autoScroll() {
        this.$nextTick(() => {
          const inputAreaEl = this.$refs.inputAreaRef;
          const lineEl = this.$refs.lineRef;

          if (!inputAreaEl || !lineEl) {
            this.autoScroll();
          }

          let curScrollPosition = 0;

          const scrollStep = () => {
            if (!inputAreaEl || !lineEl) return;

            // 检查是否是非IE浏览器---兼容IE
            if (!document.all) {
              // 获取当前滚动位置
              curScrollPosition = inputAreaEl.scrollTop;
              // 将li元素滚动到与c2相同的位置
              lineEl.scrollTop = curScrollPosition;
            }

            // 请求下一帧的动画
            window.requestAnimationFrame(scrollStep);
          };

          // 启动动画循环
          window.requestAnimationFrame(scrollStep);
        });
      },
    },

    mounted() {
      // 可调整大小时--设置输入框的监听
      this.resize && this.useTextAreaElResize();
      // 初始化自动滚动
      this.openDomAnimeFrame && this.autoScroll();
    },

    beforeDestroy() {
      const inputAreaEl = this.$refs?.inputAreaRef?.target;
      if (resizeObserver && inputAreaEl) {
        resizeObserver.unobserve(inputAreaEl);
        resizeObserver = null;
      }
    },
  };

  /** 数组除空 */
  function arrayTrim(_arr) {
    return _arr.filter((str) => str);
  }

  /** 字符串除空 */
  function stringTrim(_val, _advence = false) {
    // 高级模式--空格、换行、制表全局全部除掉
    // windows平台  `\r\n` 才会换行
    if (_advence) {
      return _val.replace(/[\s\t\r\n]+/gi, '');
    }
    // 仅开始和结尾除空格
    return _val.replace(/(^\s*)|(\s*$)/g, '');
  }

  /** 判空 */
  function isBlank(testVal) {
    var regVal = /^\s*$/;
    return regVal.test(testVal);
  }

  /** 计算字符长度 */
  function calcStrLen(strVal) {
    strVal = customTrim(strVal);
    var cArr = strVal.match(/[^\x00-\xff]/gi);
    return strVal.length + (cArr == null ? 0 : cArr.length);
    // strVal.match(/[^\x00-\xff]/gi); 匹配所有非ASCII的字符，即中文字符
    // 中文字符串占位 2个字符
    // ASCII码字符串占位1个字符
  }
</script>

<style lang="scss" scoped>
  $c-base: #000;
  $c-grey: #999;

  .multi-line-textarea__wrapper {
    position: relative;
    max-width: 100%;
    max-height: 100%;
    overflow: hidden;
  }

  .text-grey {
    color: $c-grey !important;
  }

  // 行号列
  #lineEl {
    position: absolute;
    z-index: 1;
    top: 0;
    left: 0;
    margin: 0px;
    padding: 0px;
    border: 0;
    outline: none;
    width: 23px;
    height: 100%;
    background: #ecf0f5;
    overflow: hidden;
    line-height: 20px;
    text-align: center;
    resize: none; // 禁止展示拖动调整
  }

  // 输入框
  #inputAreaEl {
    font-family: Arial, Helvetica, sans-serif;
    border: 1px solid #e6ebf5;
    font-size: 14px;
    width: 100%;
    height: 100%;
    max-width: 100%;
    color: $c-grey;
    margin: 0px;
    padding: 0 0 0 28px;
    line-height: 20px;
    outline: none;
    // max-height: 100%;
  }

  #inputAreaEl::placeholder {
    color: $c-grey;
  }

  #inputAreaEl:focus,
  #inputAreaEl:active {
    color: $c-base;
  }
</style>
