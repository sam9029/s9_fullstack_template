<template>
  <el-select
    :value="value"
    @input="emitSomething($event, 'input')"
    @change="emitSomething($event, 'change')"
    filterable
    :multiple="multiple"
    :collapse-tags="collapseTags"
    :disabled="disabled"
    clearable
    remote
    reserve-keyword
    :placeholder="placeholder || '请选择'"
    :remote-method="remoteMethod"
    :loading="loading"
  >
    <el-option-group label="可选内容">
      <el-option
        v-for="(item, index) in options"
        :key="index"
        :label="item[nameKey]"
        :value="item[idKey]"
      >
        <div v-if="tip" class="option-show-id">
          <span>{{ item[nameKey] }}</span>
          <span class="tip-value">{{ tipFun(item) }}</span>
        </div>
      </el-option>
    </el-option-group>
    <el-option-group :label="optionLable"></el-option-group>
  </el-select>
</template>

<script>
  export default {
    props: {
      value: {
        required: true,
      },
      multiple: Boolean,
      disabled: Boolean,
      collapseTags:{
        type:Boolean,
        default:true
      },
      tip: Boolean,
      tipFun: Function,
      searchApi: {
        type: Function,
        required: true,
        default: () => {},
      },
      searchValue: {
        type: Object,
        default: () => {},
      },
      beforeApi: Function,
      nameKey: {
        type: String,
        default: 'name',
      },
      idKey: {
        type: String,
        default: 'id',
      },
      searchKey: {
        type: String,
        default: 'keyword',
      },
      // 匹配当前项
      fitOptionId: {
        default: '',
      },
      // 占位符
      placeholder: {
        type: String,
      }
    },
    data() {
      return {
        options: [],
        loading: false,
        first_emit: false,
      };
    },
    computed: {
      optionLable() {
        if (this.options.length >= 100) return '默认展示100条，余下请搜索';
        if (this.options.length) return '暂无更多';
        else return '暂无数据';
      },
    },
    watch: {
      // UN已存在远程-取消监听
      // value(newValue, oldValue) {
      //   this.getBeforedata(newValue);
      // },
    },
    mounted() {
      this.remoteMethod();
    },
    methods: {
      getBeforedata(id) {
        if (id && !this.loading) {
          let item = this.options.find((i) => i[this.idKey] == id);
          if (!item) {
            let api = this.beforeApi || this.searchApi;
            if (typeof api === 'function') {
              let search = { page: 1, pagesize: 1, ...this.searchValue };
              search[this.idKey] = id;
              this.first_emit = true;
              api(search)
                .then((data) => {
                  if (data && data.code == 0) {
                    this.options.push(
                      ...(data.data || []).map((i) => {
                        i[this.nameKey] = i[this.nameKey] || '';
                        return i;
                      }),
                    );
                  }
                  this.first_emit = false;
                })
                .catch(() => {
                  this.first_emit = false;
                });
            }
          }
        }
      },
      emitSomething(val, type) {
        this.$emit(type, val);
        if (type == 'change') {
          let item = this.options.find((i) => i[this.idKey] == val);
          if (item) this.$emit('itemChange', item);
        }
      },
      remoteMethod(val) {
        let search = { page: 1, pagesize: 100, ...this.searchValue };
        if (val || val == 0) search[this.searchKey] = val;
        if (typeof this.searchApi === 'function') {
          this.loading = true;
          this.first_emit = true;
          this.searchApi(search)
            .then((data) => {
              if (data && data.code == 0) {
                this.options = (data.data || []).map((i) => {
                  // 匹配默认项
                  if (this.fitOptionId) {
                    if (this.fitOptionId == i[this.idKey]) {
                      this.value = i[this.idKey]
                      // 给个方法解决视图层可能出现的校验问题
                      this.$emit('autoMatch', this.value);
                    }
                  }
                  i[this.nameKey] = i[this.nameKey] || '';
                  return i;
                });
              }
              this.loading = false;
              this.first_emit = false;
            })
            .catch(() => {
              this.loading = false;
              this.first_emit = false;
            });
        } else {
          this.options = [];
        }
      },
    },
  };
</script>

<style lang="scss" scoped>
  .option-show-id {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    .tip-value {
      padding-left: 15px;
      font-size: 12px;
      color: #8492a6;
    }
  }
</style>
