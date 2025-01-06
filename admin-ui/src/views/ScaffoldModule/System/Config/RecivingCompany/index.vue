<template>
  <div>
    <SearchPanel :search="search" @onSubmit="searchSubmit" @onReset="searchReset"></SearchPanel>

    <BaseTable
      :columns="columns"
      :data="list"
      :loading="tableLoading"
      :pagination="pagination"
      @pagination-change="queryList(false)"
      @refresh="queryList(false)"
      @switch-change="toggleStatus"
      @handleDelete="handleDelete"
      @handleUpdate="handleUpdate"
    >
      <template #header_left>
        <el-button
          type="primary"
          @click="addNew"
          :disabled="!$checkPermi(['sys:config:recivingcompany:add'])"
          >新增服务商主体</el-button
        >
      </template>
      <!-- <template #advertiser_types_name="{ row }">
        <el-tag size="mini" v-for="(item, index) in row.advertiser_types_name" :key="index">{{
          item
        }}</el-tag>
      </template> -->
    </BaseTable>

    <BaseDialog title="新增服务商主体" :visible.sync="visible" @close="close">
      <el-form
        ref="companyRef"
        :model="form"
        :rules="companyRule"
        label-width="110px"
        class="left-align-form"
      >
        <el-form-item label="服务商主体" prop="name">
          <el-input v-model="form.name" placeholder=""></el-input>
        </el-form-item>
        <el-form-item label="每月打款限额" prop="money_upper">
          <el-input type="number" v-model="form.money_upper" class="number-input">
            <span slot="append">元 / 人</span>
          </el-input>
        </el-form-item>
        <el-form-item label="当前费率" prop="rate">
          <el-input type="number" v-model="form.rate" class="number-input">
            <span slot="append">%</span>
          </el-input>
        </el-form-item>
        <!-- <el-form-item label="项目名称" prop="advertiser_types">
          <el-select
            v-model="form.advertiser_types"
            style="width: 100%"
            :multiple="false"
            clearable
            filterable
            remote
            :remote-method="queryAdvertiser"
            @visible-change="visibleChange"
          >
            <el-option v-for="item of advertiserList" :key="item.value" v-bind="item"></el-option>
          </el-select>
        </el-form-item> -->
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="close">取 消</el-button>
        <el-button type="primary" @click="submitCompany">确 定</el-button>
      </div>
    </BaseDialog>
  </div>
</template>

<script>
  import SearchPanel from '@/components/Common/SearchPanel';
  import BaseDialog from '@/components/BaseDialog/index.vue';
  import BaseTable from '@/components/BaseTable/index.vue';
  import { STATUS_OPTIONS, ADVERTISER_TYPE_MAPPER } from '@/utils/mapper.js';
  import { columns } from './data';
  import { list, create, update } from '@/api/system/recivingCompany.js';
  import { mapperToOptions } from '@/utils/tools';
  import { adverDownList } from '@/api/account/advertiser/advertiser.js';

  export default {
    components: {
      SearchPanel,
      BaseTable,
      BaseDialog,
    },
    data() {
      return {
        search: {
          model: {
            keyword: '',
            status: '',
          },
          item: [
            {
              genre: 'input',
              label: '服务商主体名称或ID：',
              model: 'keyword',
              placeholder: '请输入服务商主体名称或ID',
            },
            {
              genre: 'select',
              label: '启用状态：',
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
          name: '',
          money_upper: '',
          rate: '',
          // advertiser_types: [],
        },
        visible: false,
        submitLoading: false,
        companyRule: {
          name: [{ required: true, message: '请输入服务商主体！', trigger: 'change' }],
          money_upper: [{ required: true, message: '请输入每月打款限额！', trigger: 'change' }],
          rate: [{ required: true, message: '请输入费率！', trigger: 'change' }],
        },
        // advertiserList: [],
      };
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
              v.money_upper = v.money_upper / 100;
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
        const params = { id: row.id, status: row.flag };
        update(params)
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
        this.$confirm(`确认删除服务商主体 ${row.name} ?`, '提示', {
          type: 'warning',
          callback: (action) => {
            if (action == 'confirm') {
              update({ id: row.id, status: 3 })
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
        this.form.name = row.name;
        this.form.money_upper = row.money_upper;
        this.form.rate = row.rate;
        // this.form.advertiser_types = row.advertiser_types;
        this.visible = true;
      },
      close() {
        this.visible = false;
        this.form = {
          name: '',
          money_upper: '',
          rate: '',
          // advertiser_types: [],
        };
      },
      // visibleChange(flag){
      //   if(flag){
      //     this.queryAdvertiser();
      //   }
      // },
      submitCompany() {
        this.$refs.companyRef.validate((valid) => {
          if (valid) {
            const { id, name, money_upper, rate, advertiser_types } = this.form;
            // const nameTrim = name.trim();
            // let upperTrim = money_upper.trim();
            if (money_upper) {
              if (!parseFloat(money_upper)) {
                return this.$notify.warning('请输入正确的汇款上限！');
              }
            }
            if (!name) return this.$notify.warning('请完善主体信息！');
            const param = {
              name: name,
              money_upper: +money_upper,
              rate: rate,
              id: id,
              // advertiser_types: advertiser_types,
            };
            this.submitLoading = true;
            const func = id ? update : create;
            return func(param)
              .then(() => {
                this.submitLoading = false;
                this.$notify.success('保存成功！');
                this.close();
                this.$emit('success');
                this.searchSubmit();
              })
              .catch((err) => {
                this.submitLoading = false;
                this.$notify.error(err.message || err || '保存失败!');
              });
          }
        });
      },
      queryReceiveList() {
        list().then((res) => {
          this.receiveList = res.data;
        });
      },
      // queryAdvertiser(keyword = '') {
      //   adverDownList({ keyword }).then((data) => {
      //     this.advertiserList = keyword?data.data:data.data;
      //   });
      // },
    },
    mounted() {
      this.searchSubmit();
      // this.queryAdvertiser();
    },
  };
</script>

<style lang="scss" scoped></style>
