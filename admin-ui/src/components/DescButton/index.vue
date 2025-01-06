<template>
  <span class="desc-button">
    <el-tooltip
      v-if="desc"
      effect="dark"
      :open-delay="100"
      :hide-after="1000"
      :content="desc"
      placement="top"
    >
      <el-button
        @click.native.prevent="emitClick"
        :type="type"
        :icon="icon"
        :circle="circle"
        :size="size"
        :round="round"
        :plain="plain"
      >
        <span v-if="button_text">{{ button_text ? icon : null }}</span>
      </el-button>
    </el-tooltip>

    <el-button
      @click.native.prevent="emitClick"
      v-else
      :type="type"
      :icon="icon"
      :plain="plain"
      :size="size"
      :round="round"
      :circle="circle"
    >
      <span v-if="button_text">{{ button_text ? icon : null }}</span>
    </el-button>
  </span>
</template>

<script>
  export default {
    props: {
      circle: Boolean,
      plain: Boolean,
      round: Boolean,
      button_text: Boolean,
      size: {
        type: String,
        default: 'small',
      },
      desc: {
        type: String,
        default: '',
      },
      type: {
        type: String,
        default: 'primary',
      },
      icon: {
        type: String,
        default: 'el-icon-delete',
      },
    },
    data() {
      return {
        key: '',
      };
    },
    methods: {
      emitClick() {
        this.$emit('click');
      },
    },
  };
</script>

<style lang="scss" scoped>
  .desc-button + .desc-button {
    margin-left: 8px;
  }
</style>
