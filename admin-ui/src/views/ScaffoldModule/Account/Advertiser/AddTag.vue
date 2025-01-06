<template>
  <div>
    <el-input
      class="add-tag-input"
      :placeholder="placeholder"
      v-model="tag"
      @keyup.enter.native="addTag(tag)"
    >
      <el-button slot="append" @click="addTag(tag)">添加（回车键）</el-button>
    </el-input>
    <div>
      <el-tag
        class="add-tag-item"
        v-for="tag in uniqTags"
        :key="tag"
        closable
        @close="handleTagClose(tag)"
      >
        {{ tag }}
      </el-tag>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    value: {
      type: Array
    },
    tagMaxLen: {
      // 每个标签字数限制
      type: Number,
      default: 10
    },
    maxLength: {
      // 标签最多个数
      type: Number,
      default: 20
    },
    name: {
      type: String,
      default: '标签'
    }
  },
  data() {
    return {
      tag: '',
      // tags: []
    }
  },
  computed:  {
    uniqTags() {
      return Array.from(new Set(this.value));
    },
    placeholder() {
      return `最多${this.maxLength}个${this.name},每个不超过${this.tagMaxLen}个字,可空格分隔`
    }
  },
  methods: {
    addTag(tag) {
      if (tag == "") return;
      let str = tag.trim().split(/\s+/);
      str.push(...this.value);
      str = [...new Set(str)];
      let index = str.findIndex((item) => {
        item.length > 10;
      });
      if (index != -1) {
        this.$notify.error(`${this.name}内容不能超过${this.tagMaxLen}个字，请正确输入！`);
        return;
      }
      if (str.length > 20) {
        this.$notify.error(`最多添加${this.maxLength}个${this.name}！`);
        return;
      }
      // this.tags = str;
      this.tag = "";
      this.$emit('input', str);
    },
    handleTagClose(tag) {
      const tags = this.value.slice();
      const newTags = tags.filter(v => v!= tag);
      this.$emit('input', newTags);
    },
  }
}
</script>

<style lang="scss" scoped>
.add-tag-item {
  margin: 8px 10px 0px 0px;
}
</style>