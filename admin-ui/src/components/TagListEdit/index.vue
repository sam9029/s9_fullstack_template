<template>
  <div class="tag-list-edit">
    <div v-if="tagOnly" class="show-tag-only">
      <el-tag v-for="item in data" :key="item">{{ item }}</el-tag>
    </div>
    <div v-else class="tag-item">
      <el-popover >
        <div class="tag-popover-select">
          <el-select
            v-model="currentListOptions"
            multiple
            filterable
            clearable
            :collapse-tags="!disabled"
            :disabled="disabled"
            placeholder="请选择标签"
            @change="changeSelect"
          >
            <el-option
              v-for="item in localSource"
              :key="item.value"
              :value="item.value"
              :label="item.label"
            ></el-option>
          </el-select>
          <!-- slot默认内容的语法兼容 -->
          <template v-if="edit">
            <slot v-if="$slots.button" name="button"></slot>
            <template v-else>
              <el-button size="mini" type="primary" :loading="loading" @click="submitTag"
                >提交</el-button
              >
            </template>
          </template>
        </div>
        
        <div slot="reference">
          <i v-if="!data.length" class="el-icon-edit pointer" @click="clickEl"></i>
          <div v-else class="show-tag-only pointer">
            <el-tag v-for="item in data" :key="item.label" @click="clickEl">{{ item.label }}</el-tag>
          </div>
        </div>
        
      </el-popover>
    </div>
  </div>
</template>

<script>
  import { tagList } from '@/api/system/tag.js'
  export default {
    props: {
      id: {
        type: [Number,null],
        default: null
      },
      // 数据
      data: {
        type: Array,
        default: () => [],
      },
      // 选项
      source: {
        type: Array,
        default: () => [],
      },
      disabled: {
        type: Boolean,
        default: false
      },
      edit: {
        type: Boolean,
        default: false
      },
      tagOnly: {
        type: Boolean,  // 仅展示tag
        default: false
      },
      remoteData: {
        type: Object
      },
      remoteField: {
        type: String
      }
    },
    data() {
      return {
        currentRowId: null,
        localSource: this.source,
        currentListOptions: [], // 当前已选中标签
        loading: false,
      };
    },
    created() {
      if(this.data.length){
        // this.data 格式 [{label:'',value:''}]
        let temp = []
        this.data.map(item=>{
          if(item instanceof Object){
            temp.push(item.value || item.id)
          }else if(['string','number'].includes(typeof item)){
            temp.push(Number(item))
          }
        })
        this.currentListOptions = temp
      }
    },
    methods: {
      changeSelect(val) {        
        this.$emit('change', { list: val, id: this.id });
      },

      check() {
        let params = {
          business_types: []
        }
        if(Array.isArray(this.remoteData[this.remoteField])) {
          params.business_types = this.remoteData[this.remoteField]
        } else {
          params.business_types = [this.remoteData[this.remoteField]]
        }
        return params
      },

      async clickEl() {
        try {
          const res = await tagList(this.check())
          if(res && res.code === 0) {
            this.localSource = res.data.map(el => {
              return {
                value: el.id,
                label: el.name
              }
            })
          }
        } catch (error) {
          this.$notify.error(error)
        }
      },
      async submitTag() {
        const listener = this.$listeners.submit;
        if (listener && typeof listener == "function") {
          if (this.loading) return;
          this.loading = true;
          await listener(this.id, this.currentListOptions);
          this.loading = false;
        }
      }
    },
  };
</script>

<style lang="scss" scoped>
  .tag-item, .show-tag-only {
    display: grid;
    grid-auto-flow: column;
    grid-column-gap: 5px;
    grid-template-columns: min-content;
    justify-items: start;
    overflow-x: auto;
    padding-bottom: 5px;
  }
  .tag-popover-select {
    display: flex;
    gap: 10px;
  }

  .el-icon-edit{
    // vertical-align: baseline;
    margin-top: 5px; 
    margin-left: 5px; 
  }
</style>
