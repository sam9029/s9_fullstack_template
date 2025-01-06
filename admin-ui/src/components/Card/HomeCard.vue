<template>
  <el-card shadow="always">
    <div class="newCard">
      <el-image
        style="width: 80px; height: 80px"
        :src="`https://koc-img.lizhibj.cn/manage/${imgName}.svg`"
        fit="fill"
      ></el-image>
      <div style="padding-left: 16px; flex: auto">
        <div style="display: flex; justify-content: space-between; align-items: center">
          <h1 style="display: inline-block">{{ title }}</h1>

          <el-tooltip effect="dark" :disabled="!isEmpty(link)" placement="top">
            <div slot="content">暂无权限</div>
            <el-button type="text" @click="go(link)" :class="{ 'is-disabled': isEmpty(link) }">
              管理
            </el-button>
          </el-tooltip>
        </div>

        <!-- <template v-if="len <= 2"> -->
        <div v-if="list && !has" style="margin-top: 4px">
          <div
            v-for="(item, index) in list.in"
            class="ant-statistic-title"
            :key="item.label + index"
            style="display: flex; width: 100%"
          >
            {{ item.label }}：
            <span
              class="ant-statistic-content"
              style="
                width: calc(100% - 75px);
                overflow: hidden;
                display: inline-block;
                text-overflow: ellipsis;
              "
              >{{ item.value || 0 }}</span
            >
          </div>
        </div>
        <!-- </template> -->

        <el-tooltip placement="right" v-if="has">
          <div slot="content">
            <div
              v-for="(item, index) in list.out"
              :key="item.label + index"
              class="ant-statistic-title color-white"
            >
              {{ item.label }}：
              <span class="ant-statistic-content color-white">
                {{ item.value || 0 }}
              </span>
            </div>
          </div>

          <span style="display: inline-block">
            <template v-for="(item, index) in list.in">
              <label
                :key="item.label + index"
                class="ant-statistic-title"
                v-if="index < 2"
                style="display: inline-block"
              >
                {{ item.label }}：
                <span class="ant-statistic-content">
                  {{ item.value || 0 }}
                </span>
              </label>
              <br :key="item.label" v-if="index < 2" />
            </template>
          </span>
        </el-tooltip>
      </div>
    </div>
  </el-card>
</template>

<script>
  import { isEmpty } from 'lodash';
  export default {
    props: {
      title: { type: String, default: '标题' },
      imgName: { type: String, default: 'pinglun' },
      dataSource: {
        type: Object,
        default: () => {},
      },
      link: { type: String, default: '' },
    },
    data() {
      return { isEmpty };
    },
    computed: {
      list() {
        if (!this.dataSource.hasOwnProperty('out')) {
          return { in: this.dataSource.in, out: this.dataSource.in };
        } else {
          return { in: this.dataSource.in, out: this.dataSource.out };
        }
      },
      has() {
        if (this.dataSource.hasOwnProperty('out')) {
          return true;
        }
        if (this.dataSource.hasOwnProperty('in') && this.dataSource.in.length > 2) {
          return true;
        }
        return false;
      },
    },
    methods: {
      go(url) {
        if (!isEmpty(url)) this.$router.push({ path: url });
      },
    },
  };
</script>

<style lang="scss" scoped>
  .newCard {
    height: 100%;
    min-height: 86px;
    display: flex;
    flex-direction: row;
  }
  .ant-statistic-title {
    margin-bottom: 4px;
    color: #000000;
    font-size: 14px;
  }
  .ant-statistic-content {
    color: #000000d9;
  }
  .color-white {
    color: #fff;
  }
</style>
