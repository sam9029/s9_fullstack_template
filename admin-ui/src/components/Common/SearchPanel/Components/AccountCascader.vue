<template>
  <el-cascader
    size="small"
    v-bind="$attrs"
    v-on="$listeners"
    v-model="baseValue"
    :show-all-levels="false"
    :props="cascaderOptions"
    :is-multiple="!!cascaderOptions.multiple"
  >
  </el-cascader>
</template>

<script>
  export default {
    props: ['value', 'setProps'],
    data() {
      return {
        defaultProps: {
          label: 'name',
          value: 'id',
          checkStrictly: true,
          emitPath: false,
          multiple: false,
        },
      };
    },
    computed: {
      cascaderOptions() {
        return Object.assign({}, this.defaultProps, this.$props.setProps);
      },
      baseValue: {
        get() {
          return this.value;
        },
        set(val) {
          this.$emit('input', val);
        },
      },
    },
  };
</script>
