<template>
  <div
    v-if="isExternal"
    :style="styleExternalIcon"
    class="svg-external-icon svg-icon"
    v-on="$listeners"
  />
  <svg v-else :class="svgClass" aria-hidden="true" v-on="$listeners">
    <use :xlink:href="'#'+svgName" />
  </svg>
</template>

<script>
  import { isExternal } from '@/utils/validate';

  export default {
    name: 'SvgIcon',
    props: {
      iconName: {
        type: String,
        required: true,
      },
      iconClass: {
        type: String,
        default: '',
      },
    },
    computed: {
      isExternal() {
        return isExternal(this.iconName);
      },

      svgName() {
        return `icon-${this.iconName}`;
      },

      svgClass() {
        if (this.iconClass) {
          return 'svg-icon ' + this.svgName + ' ' + this.iconClass;
        } else {
          return 'svg-icon ' + this.svgName;
        }
      },
      
      styleExternalIcon() {
        return {
          mask: `url(${this.svgName}) no-repeat 50% 50%`,
          '-webkit-mask': `url(${this.svgName}) no-repeat 50% 50%`,
        };
      },
    },
  };
</script>

<style scoped>
  .svg-icon {
    width: 1em;
    height: 1em;
    vertical-align: -0.15em;
    fill: currentColor;
    overflow: hidden;
  }

  .svg-external-icon {
    background-color: currentColor;
    mask-size: cover !important;
    display: inline-block;
  }
</style>
