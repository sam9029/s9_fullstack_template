<template>
  <div class="cascade-select">
    <el-select 
      ref="select" 
      :placeholder="`请选择${placeholder}`"
      clearable
      :disabled="disabled"
      v-model="selectedOption"
      @clear="clear"
    >
      <el-option 
        hidden
        :value="selectedOption" 
        :label="label"
      ></el-option>
      <el-tree
        :data="treeData"
        :props="defaultProps"
        :expand-on-click-node="false"
        :check-on-click-node="true"
        @node-click="handleNodeClick"
        ref='treeRef'
      ></el-tree>
    </el-select>
  </div>
</template>

<script>
  export default {
    props: {
      value: {
        type: [String, Number],
        default: ''
      },
      treeData: {
        type: Array,
        default: () => []
      },
      originSelect: {
        type: Array,
        default: () => []
      },
      placeholder: {
        type: String,
        default: ''
      },
      disabled: {
        type: Boolean,
        default: false
      },
    },
    data() {
      return {
        selectedOption: this.value,
        label: '',
        defaultProps: {
          children: 'children',
          label: 'name',
        },
      };
    },
    watch: {
      value: {
        handler(newVal) {
          this.selectedOption = newVal;
          if(newVal) {
            this.label = this.originSelect.find(el => el.id === newVal).name
          }
        },
        immediate: true
      },
      selectedOption(newOption) {
        this.$emit('change', newOption);
      }
    },
    methods: {
      // 树结构点击事件
      handleNodeClick(data) {
        // 只允许选择最下级分类
        if (data.children) {
          this.$notify.error('请选择最下级分类');
        } else {
          this.selectedOption = data.id
          this.label = data.name;
          this.$refs.select.blur();
        }
      },

      // 清空时
      clear() {
        this.selectedOption = null
        this.label = '';
      },
    },
  };
</script>