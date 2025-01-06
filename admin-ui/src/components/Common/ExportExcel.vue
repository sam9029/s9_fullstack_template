<template>
  <div>
    <el-dialog
      :title="title"
      :visible.sync="exportVisible"
      :before-close="close"
      :width="width"
      :append-to-body="true"
    >
      <el-checkbox :indeterminate="indeterminate" v-model="checkAll" @change="checkAllChange"
        >全选</el-checkbox
      >
      <el-checkbox-group v-model="exportModel">
        <el-row :gutter="20">
          <el-col class="checkbox-col" :span="6" v-for="item in checkboxList" :key="item.prop">
            <el-checkbox :label="item.prop">{{ item.label }}</el-checkbox>
          </el-col>
        </el-row>
      </el-checkbox-group>
      <span slot="footer" class="dialog-footer">
        <div v-if="showCsvExport" class="mb10">
          <el-link :underline="false" type="info" disabled> <i class="el-icon-warning"></i> 超大数据量级（5万以上）导出时请使用 导出csv</el-link>
        </div>
        <div class="flex">
          <div>
            <div v-if="columnsKey">
              <el-checkbox v-model="save_visible" :style="{ marginRight: '10px' }"
                >{{ save_visible ? '保存为' : '清除当前保存' }}常用自定义列</el-checkbox
              >
              <el-button
                @click="customConfirmation"
                type="primary"
                :disabled="save_visible == localData.save_visible && flag"
                >应用</el-button
              >
            </div>
          </div>
          <div>
            <el-button @click="close">取 消</el-button>
            <el-button v-if="showCsvExport" :disabled="!exportModel.length" type="primary" @click="sure('csv')"
            >导 出 csv</el-button
            >
            <el-button :disabled="!exportModel.length" type="primary" @click="sure('xlsx')"
            >导 出 xlsx</el-button
            >
            <slot name="button" :col="handlerCol()" :epxort_params="epxort_params"></slot>
          </div>
        </div>
      </span>
    </el-dialog>
  </div>
</template>

<script>
  export default {
    components: {},
    props: {
      title: {
        type: String,
        default: '导出列选择',
      },
      exportVisible: {
        type: Boolean,
        default: false,
      },
      width: {
        type: String,
        default: '800px',
      },
      tableItem: {
        type: Array,
        default: () => [],
      },
      type: {
        type: String,
        default: '',
      },
      typeEvent: {
        type: String,
        default: '',
      },
      defaultCheck: Array,
      columnsKey: {
        type: String,
        default: '',
      },
      showCsvExport:{
        type: Boolean,
        default: true,
      }
    },
    data() {
      return {
        exportModel: [],
        checkboxList: [],
        save_visible: true,
        localData: {},
        flag: false,
        export_type: 'xlsx',
      };
    },
    watch: {
      exportVisible: {
        handler(val, old) {
          if (val) {
            let localData =
              (this.columnsKey && localStorage.getItem('exp_col_' + this.columnsKey)) ||
              JSON.stringify({});
            localData = JSON.parse(localData);
            this.localData = localData;
            if (this.save_visible != localData.save_visible) {
              // 在 localData.save_visible 不为 null 或 undefined （初次状态获取）时、不执行this.save_visible 改变
              let dataType = Object.prototype.toString.call(localData.save_visible);
              if (!['[object Null]', '[object Undefined]'].includes(dataType)) {
                this.save_visible = localData.save_visible;
              }
            }
            if (localData.save_visible) {
              this.exportModel = localData.exportModel;
            } else {
              if (this.defaultCheck?.length) {
                this.exportModel = this.defaultCheck.slice();
              } else {
                this.exportModel = this.checkboxList.map((t) => t.prop);
              }
            }
          }
        },
        immediate: true,
        deep: true,
      },
      exportModel: {
        handler(val, old) {
          this.flag = JSON.stringify(val) == JSON.stringify(this.localData.exportModel);
        },
        immediate: true,
        deep: true,
      },
      tableItem: {
        handler(val, old) {
          this.checkboxList = [];
          val.forEach((t) => {
            if (t.prop != 'action') this.checkboxList.push(t);
          });
          if (this.defaultCheck?.length) {
            this.exportModel = this.defaultCheck.slice();
          } else {
            this.exportModel = this.checkboxList.map((t) => t.prop);
          }
        },
        immediate: true,
        deep: true,
      },
    },
    computed: {
      checkAll: {
        get() {
          return this.exportModel.length == this.checkboxList.length;
        },
        set(val) {},
      },
      indeterminate() {
        return this.exportModel.length < this.checkboxList.length && this.exportModel.length > 0;
      },
    },
    mounted() {
      // this.tableItem.forEach((t) => {
      //   if (t.prop != 'action') this.checkboxList.push(t);
      // });
      // if (this.defaultCheck?.length) {
      //   this.exportModel = this.defaultCheck.slice();
      // } else {
      //   this.exportModel = this.checkboxList.map((t) => t.prop);
      // }
    },
    methods: {
      sure(export_type = 'xlsx') {
        let arr = this.handlerCol();
        this.epxort_params = { export_type };
        this.$emit('exportCol', arr, { export_type });
        this.close();
      },
      close() {
        this.$emit('update:exportVisible', false);
      },
      checkAllChange(val) {
        this.exportModel = val ? this.checkboxList.map((t) => t.prop) : [];
      },
      typeChange() {
        let arr = this.handlerCol();
        this.$emit(this.typeEvent, arr);
        this.close();
      },
      handlerCol() {
        let arr = [];
        this.exportModel.forEach((t) => {
          let item = this.checkboxList.find((k) => k.prop == t);
          if (item) {
            arr.push({
              label: item.label,
              prop: item.prop,
            });
          }
        });
        return arr;
      },

      // 应用自定义列
      customConfirmation() {
        // localStorage.setItem(this.columnsKey, JSON.stringify(da))
        let text = `是否${this.save_visible ? '将当前选中保存为' : '清除当前保存'}自定义列?`;
        this.$confirm(text, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
          .then(() => {
            let data = {
              save_visible: this.save_visible,
              exportModel: this.save_visible ? this.exportModel : [],
            };

            this.columnsKey &&
              localStorage.setItem('exp_col_' + this.columnsKey, JSON.stringify(data));
            this.$notify({
              type: 'success',
              message: `自定义列${this.save_visible ? '保存' : '清除'}成功！`,
            });
          })
          .catch(() => {
            // this.$notify({
            //   type: 'info',
            //   message: '已取消删除'
            // });
          });
      },
    },
  };
</script>

<style lang="scss" scoped>
  ::v-deep .el-dialog {
    display: flex;
    flex-direction: column;
    margin: 0 !important;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  ::v-deep .el-dialog .el-dialog__body {
    flex: 1;
    overflow: auto;
    padding: 10px 20px;
  }
  .checkbox-col {
    margin: 5px 0;
  }
  .flex {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
</style>
