<template>
  <div id="app">
    <BaseTable
      :columns="columns"
      :data="tableData"
      :pagination="pagination"
      :loading="tableLoading"
      :type="['radio', 'expand', 'index']"
      :expand-row-keys="[]"
      @refresh="getTableData()"
      @pagination-change="paginationChange"
      @select-change="selectChange"
      @actionEdit="actionEdit"
    >
      <!-- 插槽传出的数据为 行数据 列数据 index -->
      <template #name="{ row, column, index }"> 外部{{ row.name }} </template>
      <template #tag="scope">{{ scope }}</template>
      <template #header_left>
        <!-- 左上按钮区域默认插槽 -->
        <el-button>默认按钮</el-button>
      </template>
      <template #header_right>
        <!-- 右上按钮区域默认插槽 -->
        <el-button icon="el-icon-download" circle></el-button>
      </template>

      <!-- 禁止使用的插槽名称有  header_left header_right action -->

      <!-- 可能会使用到插槽名称有  empty  内部已经设置空状态了 也可以自己重新设置-->

      <!-- <template #action="{ row, column, index }"> 按钮 </template> -->
    </BaseTable>
  </div>
</template>
<script>
  import BaseTable from '@/components/BaseTable/index.vue';
  export default {
    name: 'Post',
    components: { BaseTable },
    data() {
      return {
        pagination: { pagesize: 20, count: 900, page: 1 },
        columns: [
          {
            label: '序号',
            prop: 'id',
          },
          {
            label: '用户名',
            prop: 'name',
            slots: { customRender: 'name' },
          },
          {
            label: '进度',
            prop: 'progress',
            slots: { customRender: 'progress' },
          },
          {
            label: '开关',
            prop: 'open',
            slots: { customRender: 'switch' },
          },
          {
            label: '日期',
            prop: 'date',
            slots: { customRender: 'dateTime' }, // 内部有默认时间处理方式 支持毫秒和年月日
          },
          {
            label: '金额',
            prop: 'price',
            slots: { customRender: 'money' },
          },
          {
            label: '比率',
            prop: 'rate',
            slots: { customRender: 'rate' }
          },
          {
            label: '地址',
            auth: ['test'],
            children: [
              { prop: 'province', label: '省份' },
              { prop: 'city', label: '市区' },
              { prop: 'address', label: '小区' },
            ],
          },
          {
            prop: 'action',
            actions: [
              {
                label: '修改',
                onClick: 'actionEdit',
              },
              {
                label: '编辑',
                disabled: true,
              },
              {
                label: '删除',
                onClick: 'actionEdit',
              },
              {
                label: '查看',
              },
            ],
          },
        ],
        tableData: [],
        tableLoading: false,
      };
    },
    created() {
      this.getTableData();
    },
    methods: {
      // 分页切换
      paginationChange(val) {
        console.log('paginationChange', val);
        this.pagination = val;
        this.getTableData();
      },
      // 操作 修改 事件
      actionEdit(row, column, $index) {
        console.log('actionEdit', row, column, $index);
      },
      // 单选 多选 选中值
      selectChange(data) {
        console.log('selectChange', data);
      },
      getTableData() {
        this.tableLoading = true;
        this.tableData = [];
        let a = (this.pagination.page - 1) * this.pagination.pagesize;
        let b = this.pagination.page * this.pagination.pagesize;
        for (let i = a; i < b; i++) {
          this.tableData.push({
            id: 10000 + i,
            date: 1639627877 + i * 1000,
            progress: Math.floor(Math.random() * 101),
            name: '王小虎',
            province: i % 3 == 0 ? '上海' : '',
            city: '普陀区',
            address: '上海市普陀区金沙江路 1518 弄',
            open: Math.floor(Math.random() * 2),
          });
        }
        setTimeout(() => {
          this.tableLoading = false;
        }, 1000);
      },
    },
  };
</script>
