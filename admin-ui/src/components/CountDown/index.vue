<template>
  <div v-show="time >= 0">{{ show }}</div>
</template>

<script>
  export default {
    props: {
      count: {
        type: Number,
        default: 120,
      },
      desc: {
        type: String,
        default: '二维码$秒后过期',
      },
    },
    data() {
      return {
        time: 0,
        timer: null,
      };
    },
    mounted() {
      this.init();
    },
    activated() {
      this.init();
    },
    deactivated() {
      this.close();
    },
    destroyed() {
      this.close();
    },
    methods: {
      init() {
        this.close();
        this.time = this.count;
        this.timer = setInterval(() => {
          if (this.time == 0) {
            clearInterval(this.timer);
            this.timer = null;
            return this.$emit('change');
          }
          this.time--;
        }, 1000);
      },
      close() {
        if (this.timer) {
          clearInterval(this.timer);
          this.timer = null;
          this.time = 0;
        }
      },
    },
    computed: {
      show() {
        if (this.desc) return this.desc.replace('$', this.time);
        return this.time;
      },
    },
  };
</script>

<style></style>
