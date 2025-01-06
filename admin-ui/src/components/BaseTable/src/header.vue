<template>
  <div>
    <div class="left">
      {{ title }}
      <slot name="header_left" v-if="!title"></slot>
    </div>
    <div class="right">
      <slot name="header_right"></slot>

      <DescButton
        v-if="!unFullscreen"
        v-fullscreen.teleport="options"
        circle
        plain
        desc="全屏"
        :size="size"
        icon="el-icon-full-screen"
      />

      <DescButton
        v-if="!unRefresh"
        icon="el-icon-refresh"
        circle
        plain
        desc="刷新"
        :size="size"
        @click="$emit('refresh')"
      />

      <CustomLine
        v-if="!unCustom && columnsKey"
        :columns="columns"
        :columnsGroup="columnsGroup"
        :columnsKey="columnsKey"
        @columnsChange="columnsChange"
      />
    </div>
  </div>
</template>

<script>
  import { directive as fullscreen } from 'vue-fullscreen';
  import CustomLine from './custom.vue';
  import DescButton from '@/components/DescButton/index.vue';

  export default {
    directives: {
      fullscreen,
    },
    components: {
      CustomLine,
      DescButton,
    },
    props: {
      title: {
        type: String,
        default: '',
      },
      size: {
        type: String,
        default: 'small',
        validator: function (value) {
          return ['medium', 'small', 'mini'].indexOf(value) !== -1;
        },
      },
      unFullscreen: {
        type: Boolean,
        default: false,
      },
      unRefresh: {
        type: Boolean,
        default: false,
      },
      unCustom: {
        type: Boolean,
        default: false,
      },
      columns: {
        type: Array,
        default: () => [],
      },
      columnsGroup: {
        type: Array,
        default: () => [],
      },
      columnsKey: {
        type: String,
        default: '',
      },
    },
    data() {
      return {
        options: {
          target: '#baseTable',
          callback: (isFullscreen) => {
            this.$emit('calcTableHeight');
          },
          bodyEl: null,
        },
      };
    },
    methods: {
      columnsChange(data) {
        this.$emit('columnsChange', data);
      },
    },
  };
</script>

<style lang="scss" scoped></style>
