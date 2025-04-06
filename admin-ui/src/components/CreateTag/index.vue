<template>
  <div class="creative-tag" :v-loading="saveLoading">
    <div class="buttons">
      <div class="input_wrapper">
        <el-input
          class="mr10"
          :placeholder="local_placeholder"
          v-model="tag"
          @keyup.enter.native="addTag(tag)"
          style="width: 484px"
        >
          <el-button slot="append" @click="addTag(tag)">添加（回车键）</el-button>
        </el-input>

        <slot name="afterAInputAppend"></slot>
      </div>
    </div>
    <el-card shadow="never" class="creative-container" v-if="creative_tags.length > 0">
      <div slot="header" class="container-header">
        <span> {{ creative_tags.length }} / {{ extensions.max }}</span>
        <el-button type="text" @click="clearAllTags">清除</el-button>
      </div>
      <div class="tag-items-container">
        <p v-for="(item, index) in creative_tags" :key="item" class="tag-item">
          <span>{{ item }}</span>
          <i class="el-icon-close" @click="deleteTag(index)"></i>
        </p>
      </div>
    </el-card>
  </div>
</template>

<script>
  // import {
  //   getAdSet,
  //   saveAdSet,
  //   editAdSet,
  // } from "@/api/Extension/AdManage/toutiaoAdSet";

  /**
   * 字符串占位符长度位数计算
   * - 使用返回字段 记得除于2
   * @param string
   * @returns Number
   */
  export function countStringLength(string) {
    var len = string.length;
    var count = 0;
    for (var i = 0; i < len; i++) {
      var num = string.charCodeAt(i);
      // 94 ^ 脱字符 占位 2个
      // 大于 127 的字符 占位 2个 (基础ASCII码就 128个字符, 索引长度最大到127)
      if (num == 94 || num > 127) {
        count += 2;
      } else {
        // { 和 } 不占位
        if (num != 123 && num != 125) {
          count += 1;
        }
      }
    }
    return count;
  }

  export default {
    props: {
      id: {
        type: [Number, String],
        default: null,
      },
      initialdata: {
        type: Object,
        default: () => ({}),
      },
      project: {
        type: Number,
        default: null,
      },
      placeholder: {
        type: String,
        default: null,
      },
      extensions: {
        type: Object,
        default: {
          max: 10, // 最多个数
          maxLength: 10, // 单个词最大长度
          minLength: 5, // 单个词最小长度
        },
      },
    },
    computed: {
      local_tip() {
        let { maxLength, minLength } = this.extensions;
        return `每个标签 ${minLength} - ${maxLength}  个字`;
      },
      local_placeholder() {
        let { max, maxLength, minLength } = this.extensions;
        return (
          this.placeholder ||
          `最多${max}个标签，每个标签 ${minLength} - ${maxLength}  个字，可空格分隔`
        );
      },
    },
    data() {
      return {
        tag: '',
        creative_tags: [],
        saveLoading: false,
        inCommonUseTagGroup: [],
        choosedTagGroupID: null,
      };
    },
    watch: {
      initialdata: {
        handler(n, o) {
          if (JSON.stringify(n) !== JSON.stringify(o)) {
            this.creative_tags = n;
          }
        },
        deep: true,
        immediate: true,
      },
      creative_tags: {
        handler(n, o) {
          if (JSON.stringify(n) !== JSON.stringify(o)) {
            this.$emit('update:initialdata', n);
          }
        },
      },
    },

    methods: {
      addTag(tag) {
        let { max, maxLength, minLength } = this.extensions;

        if (tag == '') return;
        let str = tag.trim().split(/\s+/);
        str.push(...this.creative_tags);
        str = [...new Set(str)];

        // 找出符合条件的 元素的 索引
        let index = str.findIndex((item) => {
          let len = countStringLength(item) / 2;
          return len > maxLength || len < minLength;
        });

        if (index != -1) {
          this.$message.error(`${this.local_tip}，请正确输入！`);
          return;
        }
        // 最多个数判断
        if (str.length >= max) {
          this.$message.error(`最多能输入${max}个标签！`);
          return;
        }
        this.creative_tags = str;
        this.tag = '';
      },
      deleteTag(index) {
        this.creative_tags.splice(index, 1);
      },
      clearAllTags() {
        this.creative_tags = [];
      },
      saveTagGroup() {
        if (this.creative_tags.length == 0) return this.$message('请先添加一个标签！');
        this.$prompt('', '设置标签组名称', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputPlaceholder: '请输入标签组名称',
          inputErrorMessage: '请输入标签组名称',
          inputValidator: (data) => {
            if (!data) return false;
          },
        })
          .then(({ value }) => {
            this.saveLoading = true;
            saveAdSet({
              type: 4,
              advertiser_id: this.id,
              name: value,
              set_json: JSON.stringify(this.creative_tags),
              project_id: this.project,
            })
              .then((res) => {
                this.saveLoading = false;
                res = res.data;
                if (res && res.code == 0) {
                  this.$message.success('保存成功！');
                  this.queryTagGroups();
                } else {
                  this.$message.error('保存失败！');
                }
              })
              .catch((err) => {
                this.saveLoading = false;
                this.$message.error('保存失败！');
              });
          })
          .catch(() => {});
      },
      async queryTagGroups() {
        let params = {
          advertiser_id: this.id,
          type: 4,
          project_id: this.project,
        };
        let res = await getAdSet(params);
        if (res.data && res.data.code == 0) {
          let result = res.data.data;
          result.forEach((item) => {
            item.set_json = JSON.parse(item.set_json);
          });
          this.inCommonUseTagGroup = result;
        }
      },
      useSelectedTagGroup() {
        if (!this.choosedTagGroupID) return;
        let index = this.inCommonUseTagGroup.findIndex((item) => item.id == this.choosedTagGroupID);
        this.creative_tags = this.inCommonUseTagGroup[index].set_json;
      },
      deleteTagGroup(name, id) {
        this.$confirm(`将要删除常用标签组：【${name}】，是否继续?`, '注意', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
          .then(() => {
            editAdSet({ advertiser_id: this.id, id, flag: 4 }).then((res) => {
              this.$message({
                type: 'success',
                message: '删除成功!',
              });
              this.choosedTagGroupID = null;
              this.queryTagGroups();
            });
          })
          .catch(() => {});
      },
      getData() {
        return [...this.creative_tags];
      },
    },
  };
</script>

<style lang="scss" scoped>
  .creative-tag {
    max-width: 800px;
    .container-header {
      display: flex;
      justify-content: space-between;
    }
    ::v-deep .el-card__header {
      padding: 5px 20px;
      background: #f5f7fa;
    }
    .creative-container {
      margin: 15px 0;
    }
    .tag-items-container {
      max-height: 300px;
      overflow: auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      .tag-item {
        width: 200px;
        background: #f5f7fa;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        border-radius: 5px;
        padding: 2px 8px;
      }
    }
    .el-icon-close {
      cursor: pointer;
    }
    .buttons {
      width: 610px;
      .input_wrapper {
        display: flex;
        justify-content: space-between;
      }

      .wraning_tip {
        margin: 0;
        padding-top: 1px;
        color: #f56c6c;
        font-size: 12px;
        line-height: 12px;
      }
    }
    .choose-tag-group {
      margin: 10px 0;
    }
  }
  .select-with-delete {
    display: flex;
    justify-content: space-between;
  }
</style>
