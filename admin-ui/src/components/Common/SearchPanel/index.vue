<template>
  <div class="search-panel-root" :class="classList">
    <div class="promotion-select-container">
      <div class="filter-panel-container">
        <div class="filter-panel-options">
          <slot></slot>

          <!-- 展开按钮 -->
          <button
            v-show="realShow != 'all'"
            @click="toggleSubPanel"
            class="el-button button-like-el--default filter-panel-options-btn"
          >
            <div class="filter-panel-options-btn-content">
              <svg-icon iconName="shaixuan"></svg-icon>
              <p>所有筛选</p>
              <i class="el-icon-arrow-down"></i>
            </div>
          </button>

          <!-- 所有筛选 -->
          <transition name="el-zoom-in-top">
            <div class="filter-panel-sub-panel" v-show="showPanel">
              <ul class="sub-filters-nav-wrapper">
                <template v-for="group in groupSearch">
                  <li
                    :key="group.groupName"
                    @click="scrollToId(group.groupName)"
                    class="filter-nav-item"
                  >
                    {{ group.alias }}
                  </li>
                </template>
                <el-button class="close-sub-filters-btn" size="small" @click="hideSubPanel"
                  >收起</el-button
                >
              </ul>
              <el-scrollbar class="sub-filters-content-wrapper">
                <template v-for="group in groupSearch">
                  <div :id="group.groupName" :key="group.groupName" class="sub-filters-group">
                    <h4 class="sub-filters-group-title">{{ group.alias }}</h4>
                    <div class="sub-filters-group-wrapper">
                      <template v-for="subSearch in group.groupItem">
                        <div class="sub-filters" :key="subSearch.model">
                          <div class="sub-filter-label">
                            <el-tooltip v-if="subSearch.icon">
                              <div slot="content" v-html="subSearch.icon"></div>
                              <i class="el-icon-question label-icon"></i>
                            </el-tooltip>
                            <span class="sub-filter-name">{{ subSearch.label }}</span>
                          </div>
                          <BaseSubFilter
                            ref="baseSubFilterRef"
                            v-model="search.model[subSearch.model]"
                            v-on="$listeners"
                            :searchItem="subSearch"
                          ></BaseSubFilter>
                        </div>
                      </template>
                    </div>
                  </div>
                </template>
              </el-scrollbar>
            </div>
          </transition>

          <!-- 合并输入框 -->
          <template v-if="combinePrimary.length">
            <div class="combine-primary-input">
              <el-input
                size="small"
                :placeholder="combineInputPlaceholder"
                v-model="combineInputValue"
                @keyup.enter.native="searchSubmit"
              >
                <template slot="prepend">
                  <template v-if="combinePrimary.length > 1">
                    <el-select
                      v-model="combineItemKey"
                      @change="combineKeyChange"
                      :style="combineInputPrependWidth"
                      size="small"
                    >
                      <el-option
                        v-for="cOpt in combinePrimary"
                        :label="cOpt.label"
                        :value="cOpt.model"
                        :key="cOpt.model"
                      ></el-option>
                    </el-select>
                  </template>
                  <template v-else>
                    <span class="combine-primary-input-solo-label">{{
                      combinePrimary[0].label
                    }}</span>
                  </template>
                </template>
                <el-button slot="append" icon="el-icon-search" @click="searchSubmit"></el-button>
              </el-input>
            </div>
          </template>

          <!-- 合并日期picker -->
          <template v-if="combineDatePicker.length">
          <!-- <template > -->
            <DatePickerCombineSubFilter 
              :combineDatePicker="combineDatePicker" 
              :combineDatePickerItemKey.sync="combineDatePickerItemKey"
              :combineDatePickerValue.sync="combineDatePickerValue"
            />
          </template>

          <!-- 主要搜索 -->
          <template v-for="primary in normalPrimary">
            <div :key="primary.model" class="filter-search-boxes">
              <div class="filter-search-label">
                <span>{{ primary.label }}</span>
                <el-input v-model="primary.label" readonly placeholder=""></el-input>
              </div>
              <div class="filter-search-content">
                <SelectSubFilter
                  v-model="search.model[primary.model]"
                  v-on="$listeners"
                  :searchItem="primary"
                  :style="primary.style"
                ></SelectSubFilter>
              </div>
            </div>
          </template>

          <!-- 已选择 -->
          <template v-for="select in selectedFilters">
            <div :key="select.model" class="filter-search-boxes">
              <div class="filter-search-label">
                <span>{{ select.label }}</span>
                <el-input v-model="select.label" readonly placeholder=""></el-input>
              </div>
              <div class="filter-search-content">
                <SelectSubFilter
                  v-model="search.model[select.model]"
                  v-on="$listeners"
                  :searchItem="select"
                ></SelectSubFilter>
              </div>
            </div>
          </template>

          <slot name="append"></slot>
          
          <div class="filters-options-btn-wrapper">
            <button
              class="el-button el-button--primary is-plain el-button--small theme-color"
              @click="searchSubmit"
            >
              查询
            </button>
            <button
              class="el-button el-button--primary is-plain el-button--small theme-color"
              @click="resetAll"
            >
              重置
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  const SHOW = {
    ALL: 'all',
    SELECTED: 'selected',
    PRIMARY: 'primary',
  }

  export default {
    props: {
      search: {
        type: Object,
        default() {
          return {
            item: [],
            model: {},
          };
        },
      },
      shadow: {
        // 是否仿card样式
        type: String,
        default: 'bottom', // 'none' / 'all' / 'bottom
      },
      showAll: {
        // 搜索项较少的直接显示所有
        type: Boolean,
        default: false,
      },
      show: {
        type: String,
        // all 全部显示
        // selected primary和已选择
        // primary 
        default: SHOW.SELECTED,
      }
    },
    components: {
      BaseSubFilter: () => import('./BaseSubFilter.vue'),
      SelectSubFilter: () => import('./SelectSubFilter.vue'),
      DatePickerCombineSubFilter: () => import('./DatePickerCombineSubFilter.vue'),
    },
    data() {
      return {
        classList: [],
        // 合并输入框 TODO 同时多个输入框筛选
        combinePrimary: [],
        combineItemKey: '',
        // 合并日期输入 皆为dataRange
        combineDatePicker:[],
        combineDatePickerItemKey: '',
        combineDatePickerValue:[],
        // 其他主要搜索
        normalPrimary: [],
        // 已选择
        selectedFilters: [],
        groupSearch: [],
        subPanleClass: ['sub-panel-hide'],
        showPanel: false,
      };
    },
    watch: {
      'search.model': {
        handler(val, oldVal) {
          // TODO 可以根据val差异只改变发生改变的项
          // const changeKeys = this.getSearchChangeKey(val, oldVal);
          if (this.realShow == SHOW.SELECTED) {
            this.handleSelectFilters();
          }
        },
        deep: true,
      },
      combineDatePickerValue(val,oldVal){
        this.search.model[this.combineDatePickerItemKey] = val;
      },
      combineDatePickerItemKey(val,oldVal){
        // 清除所有的 combineDaterange 的 model 值
        this.combineDatePicker.forEach((item)=>{
          if(item.genre === 'combineDaterange'){
            this.search.model[item.model] = [];    
          }
        })
        // 重新指定 赋值
        this.search.model[val] = this.combineDatePickerValue;
      },
    },
    created() {
      switch (this.shadow) {
        case 'all':
          this.classList = ['el-card', 'is-always-shadow', 'over-show'];
          break;
        case 'bottom':
          this.classList = ['shadow-bottom'];
          break;
        case 'none':
        default:
          this.classList = [];
      }
      this.initSearchItems();
    },
    mounted() {
      this.$nextTick(this.resizeParentTable.bind(this));
      document.addEventListener('click', this.closeClickHandler);
    },
    beforeDestroy() {
      document.removeEventListener('click', this.closeClickHandler);
    },
    computed: {
      combineInputPlaceholder() {
        if (!this.combinePrimary.length) return '';
        const item = this.search.item.find((v) => v.model == this.combineItemKey) || {};
        return item.placeholder || '请输入关键字查询';
      },
      combineInputValue: {
        get() {
          return this.search.model[this.combineItemKey];
        },
        set(val) {
          this.search.model[this.combineItemKey] = val;
        },
      },
      combineInputPrependWidth() {
        const setWidth = this.$attrs['prepend-width'] || this.$attrs.prependWidth;
        return { width: setWidth || '100px' };
      },
      realShow() {
        if (this.showAll) {
          return SHOW.ALL;
        }
        return this.show;
      },
    },
    methods: {
      closeClickHandler(event) {
        if (this.realShow == SHOW.ALL) return;
        const ev = event || window.event;
        if (!this.$el.contains(ev.target)) {
          this.hideSubPanel();
        }
      },
      initSearchItems() {
        const group = {};
        let selectedFilters = [];
        const combinePrimary = [];
        const combineDatePicker = [];
        const normalPrimary = [];
        this.search.item.forEach((subItem) => {
          if (subItem.show === false) return;
          if (subItem.genre == 'input' && subItem.type != 'normal') {
            return combinePrimary.push(subItem);
          }
          if (subItem.genre == 'combineDaterange' && subItem.type != 'normal') {
            return combineDatePicker.push(subItem);
          }
          if (this.realShow == SHOW.ALL) {
            return normalPrimary.push(subItem);
          }

          // selected 和 primary 都显示primary
          if (subItem.type == 'primary') {
            return normalPrimary.push(subItem);
          }

          if (this.realShow == SHOW.SELECTED) {
            const isSelected = this.checkIsSelected(subItem);
            if (isSelected) {
              selectedFilters.push(subItem);
            }
          }
          
          const groupName = subItem.groupName || 'default';
          group[groupName] = group[groupName] || [];
          group[groupName].push(subItem);
        });
        this.combinePrimary = combinePrimary;
        this.combineDatePicker = combineDatePicker;
        this.normalPrimary = normalPrimary;
        if (combinePrimary.length) {
          this.combineItemKey = combinePrimary[0].model;
          this.checkCombineInputDefaultValue();
        }
        if (combineDatePicker.length) {
          this.combineDatePickerItemKey = combineDatePicker[0].model;
          this.checkCombineDatePickerValue();
        }
        // 初始时没有显示的 添加前两个搜索
        if (!normalPrimary.length && !selectedFilters.length && !combinePrimary.length) {
          selectedFilters = this.search.item.slice(0, 2);
        }
        this.selectedFilters = selectedFilters;
        this.groupSearch = this.handleGroupConfig(group);
      },
      handleSelectFilters() {
        const selectedFilters = [];
        this.search.item.forEach((subItem) => {
          if (subItem.show === false) return;
          if (subItem.genre == 'input' && subItem.type != 'normal') {
            return;
          }
          if (subItem.type == 'primary') {
            return;
          }
          const isSelected = this.checkIsSelected(subItem);
          if (isSelected) {
            selectedFilters.push(subItem);
          }
        });
        this.selectedFilters = selectedFilters;
      },
      /**@deprecated */
      getSearchChangeKey(newSearchModel, oldSearchModel) {
        const changeKeys = [];

        const keys = Reflect.ownKeys(newSearchModel);
        keys.forEach((k) => {
          if (!Reflect.has(oldSearchModel, k)) {
            return changeKeys.push(k);
          }

          const newVal = newSearchModel[k];
          const oldVal = oldSearchModel[k];
          const newValType = typeof newVal;
          if (['undefined', 'boolean', 'number', 'bigint', 'string'].includes(newValType)) {
            if (newVal !== oldVal) {
              changeKeys.push(k);
            }
          } else {
            // object symbol function
            if (newVal === null) {
              if (newVal !== oldVal) {
                changeKeys.push(k);
              }
            } else {
              if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
                changeKeys.push(k);
              }
            }
          }
        });

        return changeKeys;
      },
      checkCombineInputDefaultValue() {
        if (process.env.NODE_ENV !== 'development') return;
        let hasValCount = 0;
        this.combinePrimary.forEach((subItem) => {
          const modelVal = this.search.model[subItem.model];
          if (modelVal) {
            hasValCount++;
            if (hasValCount > 1) {
              console.error('SearchPanel: 为多个input设置默认值会造成逻辑处理上的困难');
            } else {
              this.combineItemKey = subItem.model;
            }
          }
        });
      },
      checkCombineDatePickerValue() {
        // if (process.env.NODE_ENV !== 'development') return;
        let hasValCount = 0;
        this.combineDatePicker.forEach((subItem) => {
          const modelVal = this.search.model[subItem.model];
          if (modelVal.length) {
            hasValCount++;
            if (hasValCount > 1) {
              console.error('SearchPanel: 为多个合并date-picker设置默认值会造成逻辑处理上的困难');
            } else {
              this.combineDatePickerItemKey = subItem.model;
              this.combineDatePickerValue = modelVal;
            }
          }
        });
      },
      handleGroupConfig(groups) {
        const groupSearch = [];
        const { groupAlias, groupSort } = this.search;
        const groupLen = Reflect.ownKeys(groups).filter((v) => v != '__ob__').length;
        for (const [groupName, group] of Object.entries(groups)) {
          if (groupName == '__ob__') continue;
          let alias = groupAlias?.[groupName] || groupName;
          let sort = groupSort?.[groupName] || 2;
          if (alias == 'default') {
            alias = groupLen == 1 ? '全部' : ' ';
            sort = 1;
          }
          groupSearch.push({
            groupName,
            alias,
            groupSort: sort,
            groupItem: group,
          });
        }
        groupSearch.sort((a, b) => a.groupSort - b.groupSort);
        return groupSearch;
      },
      setModelEmptyValue(item) {
        const modelVal = this.search.model[item.model];
        if (['string', 'number', 'undefined'].includes(typeof modelVal)) {
          this.search.model[item.model] = null;
        } else if (Array.isArray(modelVal)) {
          this.search.model[item.model] = [];
        } else if (item.genre == 'select-range') {
          this.search.model[item.model] = { gt: 0, lt: 0 };
        }
      },
      checkIsSelected(item) {
        const selectGenre = ['select', 'selectRemoteSearch', 'select-rangeNumber', 'select-user'];
        if (selectGenre.includes(item.genre)) {
          return this.checkSelect(item);
        }
        const dateGenre = ['dateYear', 'daterange', 'day'];
        if (dateGenre.includes(item.genre)) {
          return this.checkDatePicker(item);
        }
        const cascaderGenre = ['cascader', 'userCascader'];
        if (cascaderGenre.includes(item.genre)) {
          return this.checkCascader(item);
        }
        if (item.genre == 'select-range') {
          return this.checkSelectRange(item);
        }
        if (item.genre == 'input' || item.genre == 'keyword') {
          return this.checkIput(item);
        }
        return false;
      },
      checkSelect(item) {
        const modelVal = this.search.model[item.model];
        if (item.multiple) {
          return !!(modelVal && modelVal.length);
        }
        if (modelVal === null || modelVal === undefined || modelVal === '') {
          return false;
        }
        if (!item.options) {
          return !!modelVal;
        }
        if (Array.isArray(item.options)) {
          if (item.options.length) {
            return item.options.some((v) => v.value === modelVal);
          } else {
            return true;
          }
        }
        if (Object.prototype.toString.call(item.options) === '[object Object]') {
          let has = false;
          const keys = Reflect.ownKeys(item.options).filter((v) => v != '__ob__');
          if (!keys.length) return true;
          keys.forEach((k) => {
            if (k === modelVal) has = true;
          });
          return has;
        } else {
          return false;
        }
      },
      checkDatePicker(item) {
        const modelVal = this.search.model[item.model];
        if (Array.isArray(modelVal)) {
          return !!modelVal.length;
        }
        return !!modelVal;
      },
      checkCascader(item) {
        const modelVal = this.search.model[item.model];
        if (Array.isArray(modelVal)) {
          return !!modelVal.length;
        }
        return !!modelVal;
      },
      checkSelectRange(item) {
        const modelVal = this.search.model[item.model] || {};
        return modelVal.gt || modelVal.lt;
      },
      checkIput(item) {
        const modelVal = this.search.model[item.model] || '';
        return !!modelVal;
      },
      scrollToId(id) {
        if (!id) return;
        const archerEl = this.$el.querySelector(`.sub-filters-content-wrapper #${id}`);
        if (!archerEl) return;
        const scroll = archerEl.offsetTop;
        if (!scroll) return;
        // 20 padding
        archerEl.parentElement.parentElement.scrollTop = Math.max(scroll - 20, 0);
        // archerEl.scrollIntoView({
        //   behavior: "smooth",
        //   block: "start",
        // });
      },
      toggleSubPanel() {
        this.showPanel = !this.showPanel;
        if (this.subPanleClass.length) {
          this.subPanleClass = [];
        } else {
          this.hideSubPanel();
        }
      },
      hideSubPanel() {
        this.showPanel = false;
        this.subPanleClass = ['sub-panel-hide'];
      },
      combineKeyChange(cKey) {
        this.combinePrimary.forEach((cOpt) => {
          this.search.model[cOpt.model] = '';
        });
      },
      searchSubmit() {
        this.hideSubPanel();
        const emitSearch = Object.create(null);
        this.search.item.forEach((subItem) => {
          if (subItem.show == false) return;
          const modelKey = subItem.model;
          const modelVal = this.search.model[modelKey];
          if (modelVal !== undefined) {
            emitSearch[modelKey] = JSON.parse(JSON.stringify(modelVal));
          }
        });
        this.$emit('onSubmit', emitSearch);
      },
      resetAll() {
        this.$refs.baseSubFilterRef?.forEach(el => {
          el?.resetSelect()
        })
        this.$emit('onReset');
      },
      resizeParentTable() {
        return this.dispatchResizeEvent();
      },
      dispatchResizeEvent() {
        const ev = new Event('resize')
        window.dispatchEvent(ev);
      },
    },
  };
</script>

<style lang="scss" scoped>
  $border-raduis: 6px;
  .search-panel-root {
    position: relative;
    margin-bottom: 8px;
    background-color: #fff;
  }
  .over-show {
    overflow: visible;
  }
  .shadow-bottom {
    border-bottom-left-radius: $border-raduis;
    border-bottom-right-radius: $border-raduis;
    &:after {
      display: block;
      content: '  ';
      position: absolute;
      bottom: 0px;
      width: 100%;
      height: 100%;
      background-color: transparent;
      // pointer-events: none;
      z-index: -1;
      box-shadow: 0 2px 12px 0px rgb(0 0 0 / 10%);
      border-bottom-left-radius: $border-raduis;
      border-bottom-right-radius: $border-raduis;
    }
  }
  .promotion-select-container {
    min-height: 40px;
    padding: 15px 15px 7px;
    position: relative;
    overflow: visible;
    .filter-panel-sub-panel {
      min-width: 500px;
      width: 100%;
      height: 315px;
      position: absolute;
      z-index: 2001;
      top: 100%;
      left: -1px;
      background-color: #fff;
      border: 1px solid #ddd;
      display: flex;
    }
    .sub-panel-hide {
      display: none;
    }
    .sub-filters-nav-wrapper {
      position: relative;
      width: 120px;
      height: 100%;
      background-color: #f8f9fa;
      padding: 12px 0;
      .filter-nav-item {
        font-size: 14px;
        cursor: pointer;
        line-height: 32px;
        padding: 0 32px;
      }
      .close-sub-filters-btn {
        position: absolute;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
      }
    }
    .sub-filters-content-wrapper {
      position: relative;
      overflow: hidden;
      flex: 1;
      background-color: #fff;
      > :first-child {
        padding: 20px 20px;
        overflow-x: hidden;
      }
      .sub-filters-group-wrapper {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        border-bottom: 1px dashed #e4e9ed;
        &:last-child {
          border-bottom: none;
        }
        // .sub-filters {
        //   &:last-child {
        //     margin-right: 0px;
        //   }
        // }
      }
      .sub-filters-group {
        .sub-filters-group-title {
          font-size: 12px;
          font-weight: 400;
          color: #999;
          line-height: 17px;
          margin: 0 0 16px;
        }
      }
    }
  }
  .filter-panel-container {
    width: 100%;
    min-height: 30px;
    display: flex;
    flex-direction: row;
  }
  .filter-panel-options {
    display: flex;
    flex-wrap: wrap;
    .button-like-el--default {
      padding: 0 15px;
    }
  }

  .filter-panel-options-btn {
    width: 116px;
    margin-right: 10px;
    margin-bottom: 8px;
    .filter-panel-options-btn-content {
      font-size: 13px;
      display: flex;
      flex-direction: row;
      .icon {
        font-size: inherit;
      }
      p {
        margin: 0px 5px;
      }
    }
  }
  .filters-options-btn-wrapper {
    display: inline-block;
    margin-bottom: 8px;
    .button-like-el--text {
      background: 0 0;
      padding: 0px 0px;
      border: none;
      font-size: 14px;
      height: 32px;
    }
  }
  .sub-filters {
    display: flex;
    align-items: flex-start;
    margin-right: 32px;
    margin-bottom: 20px;
    .sub-filter-label {
      width: 110px;
      line-height: 32px; /** 为vertical-align提供ex */
      display: inline-block;
      margin: 0 12px 0 0;
      text-align: right;
      .label-icon {
        vertical-align: middle;
        margin-right: 5px;
        font-size: 14px;
      }
      .sub-filter-name {
        display: inline;
        vertical-align: middle;
        font-size: 14px;
        font-weight: 400;
      }
    }
  }
  .combine-primary-input {
    display: inline-block;
    width: auto;
    margin: 0 10px 8px 0;
    ::v-deep .el-input-group__prepend {
      background-color: #fff;
      color: #666;
    }
    ::v-deep > .el-input__inner {
      width: 160px;
    }
  }
  .combine-primary-input-solo-label {
    margin: 0 -10px;
  }
  .filter-search-boxes {
    display: inline-flex;
    background-color: #e4e9ed;
    padding-left: 10px;
    border-radius: 4px;
    margin-right: 8px;
    margin-bottom: 8px;
    .filter-search-content {
      position: relative;
      display: inline-flex;
      font-size: 13px;
    }
  }
  ::v-deep .filter-search-label {
    position: relative;
    display: inline-flex;
    align-items: center;
    height: 32px;
    font-size: 13px;
    color: #606266;
    span {
      visibility: hidden;
    }
    .el-input {
      position: absolute;
      left: 0;
      top: 0;
      .el-input__inner {
        padding: 0;
        margin: 0;
        background-color: transparent;
        border: none;
      }
    }
  }
</style>
