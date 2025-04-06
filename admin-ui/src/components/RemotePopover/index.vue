<template>
  <div class="remote-popover">
    <el-popover
      v-model="show"
      :open-delay="200"
      :close-delay="200"
      :visible-arrow="false"
      placement="bottom-start"
      popper-class="no-padding"
    >
      <div class="popover-header">
        <div class="search">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入项目"
            @input="changeInput()"
          ></el-input>
        </div>
        <div class="category flex">
          <span>业务类型</span>
          <el-select v-model="searchForm.business_type">
            <el-option
              v-for="item in businessOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            ></el-option>
          </el-select>
        </div>
        <div class="status flex">
          <span>状态</span>
          <el-select v-model="searchForm.status">
            <el-option
              v-for="(item, index) in statusOptions"
              :key="index"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </div>
        <div class="btn">
          <el-button class="reset" type="text" @click="queryList">查询</el-button>
          <el-button class="reset" type="text" @click="reset">重置</el-button>
        </div>
      </div>
      <div class="item-box">
        <div v-if="all" class="menu">
          <div class="link-box">
            <el-image v-if="totalItem.icon" class="icon" :src="totalItem.icon"></el-image>
            <el-link
              class="link"
              :underline="false"
              :class="activeClass(totalItem)"
              @click.stop="changeLabel(totalItem)"
              >{{ totalItem.label }}</el-link
            >
          </div>
        </div>
        <div class="item" v-for="(item, index) in searchData" :key="index">
          <p class="tab">{{ item[tab] }}</p>
          <div class="menu">
            <div class="link-box" v-for="subItem in item.list" :key="subItem.id">
              <el-image v-if="subItem.icon" class="icon" :src="subItem.icon"></el-image>
              <el-link
                class="link"
                :underline="false"
                :class="activeClass(subItem)"
                @click.stop="changeLabel(subItem)"
                >{{ subItem.label }}</el-link
              >
            </div>
          </div>
        </div>
      </div>
      <el-button class="reset-btn-class" style="width: 150px" slot="reference" type="primary">
        <el-image class="icon mr5" :src="selectItem.icon"></el-image>
        <span class="max-length">{{ selectItem.label }}</span>
        <i class="el-icon-arrow-down el-icon--right"></i>
      </el-button>
    </el-popover>
  </div>
</template>

<script>
/**
 * @description:  同级组件 通过 @change 解决首次无法获得props参数问题
 * @description:  all表示默认是否全选
 * @description:  promotion_type 1 关键词推广  2 小程序推广  表示默认是否全选
 */
import { getMenu } from '@/api/public.js';
import { advertiserCategroyList } from '@/api/public.js';
import { STATUS_OPTIONS } from '@/utils/mappers/public.js';
import { ADVERTISERPROMOTIONTYPE } from '@/utils/mappers/public';

export default {
  props: {
    reset: {
      type: Boolean,
      default: false,
    },
    all: {
      type: Boolean,
      default: false,
    },
    promotion_type: {
      type: String,
      default: null,
    },
    promotion_plan: {
      type: String,
      default: null,
    },
    product_type: {
      type: String,
      default: null,
    },
  },
  computed: {
    currentLabel() {
      const current = this.menuData.find((e) => e.value == this.value);
      if (current) return current.label;
      return '全部项目';
    },
    promotion_type_name() {
      if (this.promotion_type) {
        return ADVERTISERPROMOTIONTYPE[this.promotion_type];
      } else {
        return null;
      }
    },
  },
  watch: {
    // 输入框清空时复原
    keyword: {
      handler(newVal) {
        // 清空时
        if (!newVal) {
          this.searchData = this.dummyData;
        }
      },
      deep: true,
    },
  },
  async mounted() {
    await this.queryList();
    this.$nextTick(() => {
      if (!this.all) {
        this.value = this.menuData[0].value;
        this.selectItem = this.menuData[0];
      }
      this.$emit('change', this.value, this.selectItem);
    });
    await this.getBusinessSelect();
  },
  data() {
    let total_info = {
      label: '全部',
      value: null,
      icon: 'https://koc-img.lizhibj.cn/applet/mini-program.png',
    };
    return {
      show: false,
      value: null,
      tab: null,
      searchData: [],
      dummyData: [],
      menuData: [],
      searchForm: {
        keyword: null,
        business_type: null,
        status: null,
      },
      selectItem: { ...total_info },
      totalItem: { ...total_info },
      businessOptions: [],
      statusOptions: STATUS_OPTIONS,
    };
  },
  methods: {
    // 改变当前label
    changeLabel(item) {
      this.$emit('change', item.value, item);
      this.value = item.value;
      this.selectItem = item;
      this.show = false;
    },
    // 选中链接改变颜色
    activeClass(item) {
      if (item.value == this.value) return 'active-item';
    },
    // 重置
    reset(flag) {
      this.searchForm = this.$options.data().searchForm;
      // this.selectItem = this.$options.data().selectItem;
      // if(this.all) this.value = null
      this.queryList();
      // if (flag) {
      //   this.value = this.all ? null : this.menuData[0].value;
      // }
    },
    // 处理数组 | 生成树 {tab: '', list: [{ id: 1, ... },...]}
    handleList(type) {
      this.dummyData = this.menuData.reduce((acc, cur) => {
        const entry = acc.find((e) => e[type] === cur[type]);
        if (entry) {
          entry.list.push({ ...cur });
        } else {
          acc.push({ [type]: cur[type], list: [{ ...cur }] });
        }
        return acc;
      }, []);
      this.searchData = this.dummyData;
      // if (!this.all) sessionStorage.setItem('firstMenuId', this.menuData[0].value);
    },
    // 获取项目菜单
    async queryList() {
      try {
        const res = await getMenu({
          ...this.searchForm,
          promotion_type: this.promotion_type || null,
          promotion_plan: this.promotion_plan || null,
          product_type: this.product_type || null,
          is_test: 3,
        });
        const type = 'promotion_name';
        if (res && res.code === 0) {
          this.menuData = res.data || [];
          // 若传入 promotion_type 的筛选、必选要自主设置推广方式
          if (this.promotion_type_name) {
            res.data.map((item) => {
              item.promotion_name = this.promotion_type_name;
              return item;
            });
          }
          this.$emit('menuDataMapper', this.handleMenu(res.data));
          this.$emit('menuDataOptions', res.data);
          this.tab = type;
          this.handleList(type);
        }
      } catch (error) {
        this.$notify.error(error || '获取项目菜单失败');
      }
    },
    // 获取业务类型下拉
    async getBusinessSelect() {
      try {
        const res = await advertiserCategroyList();
        if (res && res.code === 0) {
          this.businessOptions = res.data || [];
          this.$emit('businessType', this.handleBusiness(res.data));
        }
      } catch (error) {
        this.$notify.error(error || '获取业务类型下拉失败');
      }
    },
    // 处理项目菜单枚举
    handleMenu(data) {
      let obj = {};
      if (data.length > 0) {
        data.forEach((e) => {
          obj[Number(e.value)] = e.label;
        });
      }
      return obj;
    },
    // 处理业务类型枚举
    handleBusiness(data) {
      let obj = {};
      if (data.length > 0) {
        data.forEach((e) => {
          obj[Number(e.id)] = e.name;
        });
      }
      return obj;
    },
    // 搜索触发
    changeInput: _.debounce(function name() {
      this.queryList();
    }, 300),
  },
};
</script>

<style lang="scss" scoped>
.max-length {
  max-width: 90px;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}
.reset-btn-class {
  padding: 5px 5px !important;
  ::v-deep > span {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: row;
  }
}
.remote-popover {
  margin-right: 8px;
}

.icon {
  width: 20px;
  height: 20px;
  border-radius: 4px;
}
.no-padding {
  padding: 0;
}
.active-item {
  color: var(--theme-default) !important;
}
.item-box {
  display: grid;
  grid-auto-flow: row;
  grid-gap: 10px;
  padding: 20px 0 20px 30px;
  overflow-y: auto;
  max-height: 300px;
  .tab {
    font-weight: 600;
    margin-bottom: 5px;
  }
  .menu {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-row-gap: 10px;
    justify-content: flex-start;
    .link-box {
      display: flex;
      align-items: center;
      gap: 5px;
    }
  }
}
.popover-header {
  background-color: var(--theme-light9);
  display: flex;
  align-items: center;
  height: 50px;
  padding: 0 25px;
  // font-weight: 600;
  &::before {
    content: '';
    margin-right: 8px;
    display: inline-block;
    width: 4px;
    height: 16px;
    border-radius: 2px;
    background-color: var(--theme-default);
  }
  .reset {
    margin-left: 5px;
  }
}
.flex {
  display: grid;
  grid-auto-flow: column;
  grid-gap: 5px;
  justify-content: center;
  align-items: center;
  margin-left: 8px;
  span {
    font-size: 12px;
  }
}
</style>
