<template>
  <BaseDialog @close="close" :visible.sync="dialogVisible" title="系统提示" width="600px">
    <el-table v-loading="loading" :data="data" stripe border>
      <el-table-column
        v-for="cols in tablecols"
        :key="cols.id"
        :prop="cols.prop"
        :label="cols.label"
      ></el-table-column>
    </el-table>
    <template slot="footer">
      <el-button type="primary" @click="close">确定</el-button>
    </template>
  </BaseDialog>
</template>

<script>
  export default {
    name: 'ErrorDialog',
    props: {
      title: {
        type: String,
        default: '系统提示',
      },
      tablecols: {
        type: Array,
        default: [
          { prop: 'id', label: '剧集ID' },
          { prop: 'message', label: '失败原因' },
        ],
      },
    },
    components: {
      BaseDialog: () => import('@/components/BaseDialog/index.vue'),
    },
    data() {
      return {
        dialogVisible: false,
        loading: false,
        data: [],
      };
    },
    methods: {
      /**
       * @description: 打开API
       * @param {Array} data 错误数组
       * @return {*}
       */      
      open(data = []) {
        if(!data?.length) throw new Error('data需为非空数组!')
        this.loading = true;
        this.dialogVisible = true;
        this.data = data;
        this.loading = false;
      },

      close() {
        this.data = [];
        this.dialogVisible = false;
        this.$emit('close');
      },
    },
  };
</script>