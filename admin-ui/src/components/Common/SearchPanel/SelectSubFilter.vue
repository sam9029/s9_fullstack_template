<template>
  <BaseSubFilter
    class="sub-filter-component--select"
    v-model="middleVal"
    v-on="$listeners"
    :searchItem="searchItem"
  ></BaseSubFilter>
</template>

<script>
  export default {
    props: {
      value: {},
      searchItem: {
        type: Object,
      },
    },
    components: {
      BaseSubFilter: () => import('./BaseSubFilter'),
    },
    computed: {
      middleVal: {
        get() {
          return this.value;
        },
        set(val) {
          this.$emit('input', val);
        },
      },
    },
  };
</script>

<style lang="scss" scoped>
  .filter-search-boxes {
    .sub-filter-component {
      width: unset;
    }
  }
  .sub-filter-component.sub-filter-component--select {
    // 消除已选择项白色背景
    ::v-deep .el-input__inner {
      border: none;
      background-color: transparent;
    }
    // select
    ::v-deep .el-select {
      width: 115px;
      .el-input__inner {
        text-overflow: ellipsis;
      }
      &[is-multiple='true'] {
        width: 200px;
        .el-select__tags {
          > span :last-child {
            margin-right: 0;
          }
          .el-tag {
            display: inline-block;
            position: relative;
            max-width: calc(100% - 76px);
            margin: 0px 8px 0px 0px;
            padding-right: 8px;
            .el-select__tags-text {
              display: inline-block;
              text-overflow: ellipsis;
              width: 100%;
              font-size: 13px;
              overflow: hidden;
            }
            .el-tag__close {
              position: absolute;
              top: 2px; // 多选标签删除按钮
              right: -10px;
            }
          }
          .el-select__input {
            margin-left: 5px;
          }
        }
      }
    }
    // cascader
    ::v-deep .el-cascader {
      display: flex;
      width: 115px;
      .el-input {
        display: inline-flex;
      }
      .el-input__inner {
        text-overflow: ellipsis;
      }
      &[is-multiple='true'] {
        width: 170px;
        .el-cascader__tags {
          flex-wrap: nowrap;
          align-items: center;
          > span:nth-last-child(2) {
            margin-right: 0;
          }
          .el-tag {
            display: inline-block;
            position: relative;
            max-width: calc(100% - 76px);
            margin: 0px 8px 0px 0px;
            padding-right: 8px;
            .el-select__tags-text {
              display: inline-block;
              text-overflow: ellipsis;
              width: 100%;
              font-size: 13px;
              overflow: hidden;
            }
            .el-tag__close {
              position: absolute;
              top: 2px; // 多选标签删除按钮
              right: -10px;
            }
          }
          .el-cascader__search-input {
            margin-left: 5px;
            width: 50px;
            min-width: unset;
            display: inline-flex;
            background-color: transparent;
          }
        }
      }
    }
    // 单日期选择
    ::v-deep .el-date-editor--date,
    .el-date-editor--year,
    .el-date-editor--datetime {
      .el-input__icon {
        font-size: 14px;
      }
      > input.el-input__inner {
        padding: 0px;
        padding-left: 25px;
      }
      > .el-input__prefix {
        left: 0px;
      }
      > .el-input__suffix {
        right: 0px;
      }
    }
    // 日期选择-date
    ::v-deep .el-date-editor--date {
      width: 115px;
    }
    // 日期选择-year
    ::v-deep .el-date-editor--year {
      width: 85px;
    }
    // 日期选择-datetime
    ::v-deep .el-date-editor--datetime {
      width: 165px;
    }
    // 日期范围
    ::v-deep .el-date-editor--daterange {
      // padding: 4px 0px 4px 4px; // chalk set line-height 24px
      width: 210px;
      .el-range-input {
        background-color: transparent;
      }
      .el-range-separator {
        padding: 0px 0px;
      }
      .el-range__close-icon {
        width: 20px;
      }
    }
    // el-select-range
    ::v-deep .item-select-range {
      .el-select-range {
        border: none;
        background-color: transparent;
        .select-range-section {
          width: 180px;
          padding: 0 15px;
        }
      }
    }
  }
</style>
