<template>
  <div class="mixed-info">
    <div class="name">
      <span>名称：</span>
      <el-tooltip v-if="name && strNum > 4" :content="name">
        <span>{{ handleStr(name, strNum) }}</span>
      </el-tooltip>
      <span v-else-if="name && strNum <= 4">{{ name }}</span>
      <span v-else>--</span>
    </div>
    <BaseCopy
      v-if="id"
      class="id"
      :label="`ID:`"
      :name="id"
    ></BaseCopy>
    <span class="id" v-else>ID：--</span>
  </div>
</template>

<script>
  export default {
    props: {
      name: {
        type: String,
        default: '',
      },
      id: {
        type: Number,
      },
      strNum: {
        type: Number,
        default: 4
      }
    },
    components: {
      BaseCopy: () => import('@/components/BaseCopy/index'),
    },
    data() {
      return {};
    },
    methods: {
      handleStr(str, num) {
        if (str.length > num) {
          return str.substring(0, num) + '...';
        } else {
          return str;
        }
      },
    },
  };
</script>

<style lang="scss" scoped></style>
