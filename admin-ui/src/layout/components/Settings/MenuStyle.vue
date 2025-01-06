<template>
  <div class="setting-drawer-block-checbox-item">
    <svg
      width="52px"
      height="45px"
      viewBox="0 0 52 45"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
    >
      <defs>
        <filter
          x="-9.4%"
          y="-6.2%"
          width="118.8%"
          height="122.5%"
          filterUnits="objectBoundingBox"
          id="filter-1"
        >
          <feOffset dx="0" dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset>
          <feGaussianBlur
            stdDeviation="1"
            in="shadowOffsetOuter1"
            result="shadowBlurOuter1"
          ></feGaussianBlur>
          <feColorMatrix
            values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.15 0"
            type="matrix"
            in="shadowBlurOuter1"
            result="shadowMatrixOuter1"
          ></feColorMatrix>
          <feMerge>
            <feMergeNode in="shadowMatrixOuter1"></feMergeNode>
            <feMergeNode in="SourceGraphic"></feMergeNode>
          </feMerge>
        </filter>
        <rect id="path-2" x="0" y="0" width="48" height="40" rx="4"></rect>
        <filter
          x="-4.2%"
          y="-2.5%"
          width="108.3%"
          height="110.0%"
          filterUnits="objectBoundingBox"
          id="filter-4"
        >
          <feOffset dx="0" dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset>
          <feGaussianBlur
            stdDeviation="0.5"
            in="shadowOffsetOuter1"
            result="shadowBlurOuter1"
          ></feGaussianBlur>
          <feColorMatrix
            values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.1 0"
            type="matrix"
            in="shadowBlurOuter1"
          ></feColorMatrix>
        </filter>

        <linearGradient id="gradientRed" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ff6862" />
          <stop offset="100%" stop-color="#b80c05" />
        </linearGradient>
        <linearGradient id="LightBlue" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#097dfd" />
          <stop offset="100%" stop-color="#1199fd" />
        </linearGradient>
      </defs>
      <g
        id="配置面板"
        width="48"
        height="40"
        stroke="none"
        stroke-width="1"
        fill="none"
        fill-rule="evenodd"
      >
        <g
          id="setting-copy-2"
          width="48"
          height="40"
          transform="translate(-1190.000000, -136.000000)"
        >
          <g id="Group-8" width="48" height="40" transform="translate(1167.000000, 0.000000)">
            <g
              id="Group-5-Copy-5"
              filter="url(#filter-1)"
              transform="translate(25.000000, 137.000000)"
            >
              <mask id="mask-3" fill="white">
                <use xlink:href="#path-2"></use>
              </mask>
              <g id="Rectangle-18">
                <use
                  fill="black"
                  fill-opacity="1"
                  filter="url(#filter-4)"
                  xlink:href="#path-2"
                ></use>
                <use fill="#F0F2F5" fill-rule="evenodd" xlink:href="#path-2"></use>
              </g>
              <rect
                id="Rectangle-18"
                fill="#FFFFFF"
                mask="url(#mask-3)"
                x="0"
                y="16"
                width="12"
                height="29"
              ></rect>
              <g>
                <rect
                  id="Rectangle-11"
                  :fill="calcBgColor"
                  mask="url(#mask-3)"
                  x="0"
                  y="0"
                  width="48"
                  height="14"
                ></rect>
                <text x="13" y="9" font-size="4" :fill="color">首页 账户 推广</text>
              </g>
            </g>
          </g>
        </g>
      </g>
    </svg>
    <div v-if="checked" class="setting-drawer-block-checbox-selectIcon" style="display: block">
      <i aria-label="图标: check" class="anticon anticon-check">
        <svg
          viewBox="64 64 896 896"
          data-icon="check"
          width="1em"
          height="1em"
          fill="#041b47"
          aria-hidden="true"
          focusable="false"
          class=""
        >
          <path
            d="M912 190h-69.9c-9.8 0-19.1 4.5-25.1 12.2L404.7 724.5 207 474a32 32 0 0 0-25.1-12.2H112c-6.7 0-10.4 7.7-6.3 12.9l273.9 347c12.8 16.2 37.4 16.2 50.3 0l488.4-618.9c4.1-5.1.4-12.8-6.3-12.8z"
          />
        </svg>
      </i>
    </div>
  </div>
</template>

<script>
  export default {
    props: {
      bgColor: {
        type: String,
      },
      color: {
        type: String,
      },
      checked: {
        type: Boolean,
      },
    },
    computed: {
      calcBgColor() {
        if (this.bgColor.startsWith('#')) {
          return this.bgColor;
        } else if (this.bgColor) {
          return `url(#${this.bgColor})`;
        } else {
          return undefined;
        }
      },
    },
  };
</script>

<style lang="scss" scoped>
  .setting-drawer-block-checbox-item {
    position: relative;

    border-radius: 2px;
    cursor: pointer;
    width: 52px;
    height: 52px;

    img {
      width: 48px;
      height: 48px;
    }

    .setting-drawer-block-checbox-selectIcon {
      position: absolute;
      top: 0;
      right: 0;
      width: 100%;
      height: 100%;
      padding-top: 15px;
      padding-left: 24px;
      color: #1890ff;
      font-weight: 700;
      font-size: 14px;
    }
  }
</style>
