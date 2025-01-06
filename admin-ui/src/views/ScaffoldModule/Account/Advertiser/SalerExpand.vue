<template>
  <div class="expand-table-wrapper">
    <BaseTable
      un-fullscreen
      un-refresh
      un-custom
      :canResize="false"
      :pagination="false"
      :columns="columns"
      :data="data"
      :loading="loading"
    >
      <template #header_left>
        <el-button icon="el-icon-plus" type="primary" @click="$emit('expand-add')"></el-button>
      </template>
      <template #status="{ row }">
        <el-switch v-model="row.status_copy" @change="editFlag(row)"></el-switch>
      </template>
      <template slot="empty">
        <el-empty :image-size="70"></el-empty>
      </template>
    </BaseTable>
  </div>
</template>


<script>
import BaseTable from '@/components/BaseTable/index.vue';
import { adverSalerSave } from '@/api/account/advertiser/advertiser.js';
import { expandSalerColumns } from './data';
export default {
  props: ['id', 'data', 'loading'],
  components: {
    BaseTable,
  },
  data() {
    return {
      columns: expandSalerColumns,
    };
  },
  methods: {
    editFlag(row) {
      const newStatus = row.status_copy ? 1 : 2;
      const oldStatus = !row.status_copy;
      const params = {
        id: row.id,
        status: newStatus,
      };
      adverSalerSave(params)
        .then((data) => {
          this.$notify.success('操作成功！');
          this.$emit('expand-refresh');
        })
        .catch((err) => {
          this.$notify.error(err.message || err || '操作失败！');
          row.status_copy = oldStatus;
        });
    },
  },
};
</script>