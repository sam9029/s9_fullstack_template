<template>
  <div>
    <SearchPanel :search="search" @onSubmit="searchSubmit" @onReset="searchReset"></SearchPanel>

    <BaseTable
      :columns="columns"
      :data="list"
      :loading="tableLoading"
      :pagination="pagination"
      @refresh="queryList(false)"
      @switch-change="toggleStatus"
      @handleDelete="handleDelete"
      @handleUpdate="handleUpdate"
    >
      <template #header_left>
        <el-button
          type="primary"
          @click="addNew"
          :disabled="!$checkPermi(['sys:config:material:add'])"
          >新增配置</el-button
        >
      </template>
      <template #type="scope">
        <span>{{ typeMapper[scope.row.type] }}</span>
      </template>
    </BaseTable>

    <BaseDialog title="素材配置" :visible.sync="visible" width="700px" @close="close">
      <el-form class="left-align-form" label-width="80px">
        <el-form-item label="素材类型" required>
          <el-select v-model="form.type">
            <el-option
              v-for="item in options"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="大小限制">
          <el-slider
            v-model="form.size"
            :max="sliderMax"
            :min="sliderMin"
            :marks="marks"
            :format-tooltip="formatTooltip"
            show-input
          ></el-slider>
        </el-form-item>
        <!-- <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark"></el-input>
        </el-form-item> -->
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="close">取 消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submit">确 定</el-button>
      </span>
    </BaseDialog>
  </div>
</template>

<script>
  import SearchPanel from '@/components/Common/SearchPanel';
  import BaseDialog from '@/components/BaseDialog/index.vue';
  import BaseTable from '@/components/BaseTable/index.vue';
  import { list, create, remove, update, updateStatus } from '@/api/system/material.js';
  import { STATUS_OPTIONS } from '@/utils/mapper.js';
  import { columns } from './data';

  export default {
    components: {
      SearchPanel,
      BaseTable,
      BaseDialog,
    },
    data() {
      return {
        typeMapper: {
          2: '视频',
          3: '音频',
          1: '图片',
        },
        search: {
          model: {
            // type: '',
            status: '',
          },
          item: [
            // {
            //   genre: 'input',
            //   label: '品类名称：',
            //   model: 'keyword',
            //   placeholder: '请输入品类名称或ID',
            // },
            {
              genre: 'select',
              label: '状态：',
              model: 'status',
              options: STATUS_OPTIONS,
            },
          ],
        },
        columns: columns,
        list: [],
        pagination: { pagesize: 20, count: 0, page: 1 },
        tableLoading: false,
        form: {
          type: null,
          size: 100,
        },
        visible: false,
        submitLoading: false,
        marks: {
          0: '0M',
          50: '50M',
          // 100: '100M',
          // 1024: '1G'
        },
        options: [
          {
            value: 2,
            label: '视频',
          },
          {
            value: 3,
            label: '音频',
          },
          {
            value: 1,
            label: '图片',
          },
        ],
      };
    },
    computed: {
      sliderMax() {
        switch (this.form.type) {
          case 1:
            return 20;
          case 2:
            return 1024;
          default:
            return 20;
        }
      },
      sliderMin() {
        switch (this.form.type) {
          case 1:
            return 0;
          case 2:
            return 50;
          default:
            return 0;
        }
      },
    },
    methods: {
      searchSubmit() {
        this.queryList(true);
      },
      searchReset() {
        this.search.model = {
          keyword: '',
          status: '',
        };
        this.searchSubmit();
      },
      queryList(reset) {
        if (reset) {
          this.pagination.page = 1;
        }
        const params = {
          ...this.search.model,
          ...this.pagination,
        };
        this.tableLoading = true;
        this.list = [];
        list(params)
          .then((data) => {
            this.tableLoading = false;
            this.list = data.data.map((v) => {
              v.flag = v.status == 1 ? 1 : 2;
              return v;
            });
            this.pagination.count = data.count;
          })
          .catch((err) => {
            this.tableLoading = false;
          });
      },
      addNew() {
        this.visible = true;
      },
      toggleStatus(row) {
        const old = row.flag == 1 ? 2 : 1;
        const params = { ids: [row.id], status: row.flag };
        updateStatus(params)
          .then(() => {
            this.$notify.success('操作成功！');
            this.queryList(false);
          })
          .catch((err) => {
            row.flag = old;
            this.$notify.error('操作失败！');
          });
      },
      handleDelete(row) {
        this.$confirm(`确认删除?`, '提示', {
          type: 'warning',
          callback: (action) => {
            if (action == 'confirm') {
              remove({ ids: [row.id] })
                .then(() => {
                  this.$notify.success('操作成功！');
                  this.queryList(false);
                })
                .catch((err) => {
                  this.$notify.error(err.message || err || '操作失败！');
                });
            }
          },
        });
      },
      handleUpdate(row) {
        this.form.id = row.id;
        this.form.type = row.type;
        this.form.size = row.size;
        this.visible = true;
      },
      submit() {
        const { type, size, id } = this.form;
        if (!type) return this.$notify.warning('请选择素材类型！');
        const func = id ? update : create;
        this.submitLoading = true;
        func(this.form)
          .then(() => {
            this.submitLoading = false;
            this.$notify.success('保存成功！');
            this.searchSubmit();
            this.close();
          })
          .catch((err) => {
            this.submitLoading = false;
            this.$notify.error(err.message || err || '保存失败！');
          });
      },
      close() {
        this.visible = false;
        this.form = { type: null, size: null, id: null };
      },
      formatTooltip(val) {
        if (val == 1024) {
          return '1G';
        } else {
          return val + 'M';
        }
      },
    },
    mounted() {
      this.searchSubmit();
    },
  };
</script>

<style lang="scss" scoped></style>
