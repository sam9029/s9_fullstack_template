<template>
  <el-card class="msg-preview-card" shadow="never">
    <div slot="header" class="header flex flex-between">
      <!-- <div class="icon">
        <el-avatar :size="40" :src="titleIcon"></el-avatar>
      </div> -->
      <div class="title color-gray">
        {{ subTitle || defaultSubtitle }}
      </div>
      <div class="title-time color-gray">
        {{ '13:33' }}
      </div>
    </div>
    <div class="content">
      <div class="content_list" v-for="(item, index) in content" :key="index">
        <span class="label color-gray">
          {{ item.label }}
        </span>
        <template v-if="item.prop == 'describe'">
          <div v-html="item.value"></div>
        </template>
        <template v-else>
          <el-input
            class="border-none-inpput"
            readonly
            type="textarea"
            placeholder=""
            v-model="item.value"
            :autosize="{ minRows: 1, maxRows: 6 }"
            resize="none"
          >
          </el-input>
        </template>
      </div>
    </div>

    <div v-for="button in buttons" :key="button">
      <el-divider></el-divider>
      <div class="detail">
        <div class="text color-gray">查看详情</div>
        <div>
          <i class="el-icon-arrow-right color-gray"></i>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script>
import { MESSAGE_TYPE_MAPPER } from '@/utils/mapper';
export default {
  props: {
    titleIcon: {
      default: 'https://koc-img.lizhibj.cn/pc_doc/94E2F9829DC840FF86433F70AE4C4C46.png',
    },
    subType: [Number, String],
    subTitle: String,
    content: {
      type: Array,
      default: () => [],
    },
    buttons: {
      type: Array,
      default: () => ['查看详情'],
    },
  },
  computed: {
    defaultSubtitle() {
      return MESSAGE_TYPE_MAPPER[this.subType] || ''
    }
  }
};
</script>


<style lang="scss" scoped>
.msg-preview-card {
  min-width: 500px;
  line-height: normal;
}
.color-gray {
  color: #999;
}
.header {
  display: flex;
  align-items: center;

  .icon {
    display: inline-flex;
    margin-left: 10px;
  }
  .title {
    // margin-left: 20px;
    font-size: 20px;
    font-weight: bold;
    color: black;
  }
  .title-time,.detail{
    font-size: 14px;
  }
}
.content {
  min-height: 150px;
  padding: 10px 20px;
  .content_list {
    display: flex;
    margin: 8px 0;
    font-size: 14px;
    width: 400px;

    .label {
      flex-shrink: 0;
      width: 100px;
    }

    .value {
      display: -webkit-box !important;
      overflow: hidden;
      text-overflow: ellipsis;
      -webkit-line-clamp: 4;
      -webkit-box-orient: vertical !important;
      word-break: break-all;
    }
  }
}
.detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;

  .text{
    font-size: 14px;
  }
}
.border-none-inpput {
  ::v-deep .el-textarea__inner {
    padding: 0;
    border: none;
  }
}
::v-deep .el-card__body {
  padding: 0;
}
::v-deep .el-divider--horizontal {
  margin: 0;
}

::v-deep .el-card__header {
  border-bottom: none;
  padding: 7px 15px 0 15px;
}

.el-avatar {
  ::v-deep img{
    background: rgb(6,28,70);
  }
}
</style>