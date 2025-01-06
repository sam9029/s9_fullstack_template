<template>
  <div class="start-switch">
    <i v-if="propValue == 1" class="starBtn el-icon-star-on" @click="handleStar('off')"></i>
    <i v-else-if="propValue == 0" class="starBtn el-icon-star-off" @click="handleStar('on')"></i>
  </div>
</template>

<script>
  export default {
    props: {
      value: {
        type: [Number, String, null],
        default: null
      },
      data: {
        type: Object,
        default: () => {}
      }
    },
    data () {
      return {
        propValue: this.value
      }
    },
    watch: {
      value: {
        handler(newVal) {
          this.propValue = newVal;
        },
        immediate: true
      },
    },
    methods: {
      handleStar(type) {
        this.$emit('change',type, this.data)
      }
    },
 }
</script>

<style lang='scss' scoped>
@import '@/assets/styles/variables.scss';
.starBtn {
  cursor: pointer;
}
.el-icon-star-on {
  font-size: 24px;
  color: $yellow;
}
.el-icon-star-off {
  font-size: 20px;
}
</style>