<template>
  <div>
    <template v-if="typeof item.slots.customRender == 'function'">
      {{ item.slots.customRender(row, column, $index) }}
    </template>

    <template v-else-if="item.slots.customRender == 'tag'">
      <div style="overflow-x: auto; white-space: nowrap">
        <template v-if="Array.isArray(row[column.property])">
          <el-tag
            v-for="(tag, index) in row[column.property]"
            :key="index"
            style="margin-right: 5px"
            >{{ tag }}</el-tag
          >
        </template>
        <template v-else>
          <el-tag>{{ row[column.property] }}</el-tag>
        </template>
      </div>
    </template>

    <BaseCopy :name="row[column.property]" v-else-if="item.slots.customRender == 'link'"></BaseCopy>

    <Infos v-else-if="item.slots.customRender == 'infos'" :store="row" :infos="item.infos"></Infos>

    <el-switch
      v-else-if="item.slots.customRender == 'switch'"
      v-model="row[column.property]"
      :disabled="disabledJudge(item)"
      :active-value="1"
      :inactive-value="2"
      @change="switchChange(row, column, $index)"
    ></el-switch>

    <template v-else-if="item.slots.customRender == 'dateTime'">
      {{ getDateTime(row[column.property]) }}
    </template>

    <template v-else-if="item.slots.customRender == 'money'">
      {{ getMoney(row[column.property]) }}
    </template>

    <template v-else-if="item.slots.customRender == 'rate'">
      {{ getRate(row[column.property]) }}
    </template>

    <el-progress
      v-else-if="item.slots.customRender == 'progress'"
      :percentage="row[column.property]"
    ></el-progress>

    <BaseStatus
      v-else-if="item.slots.customRender == 'statusComps'"
      :mapper="setStatusMapper(item, row)"
      :status="row[column.property]"
      :iconClass="setStatusClass(item, row, column.property)"
      :reason="setStatusReason(item, row)"
    ></BaseStatus>

    <FilesSwiper 
      v-else-if="item.slots.customRender == 'imageComps'" 
      :files="row[column.property]"
    ></FilesSwiper>
  </div>
</template>
<script>
  import moment from 'moment';
  import { isEmpty } from 'lodash';

  export default {
    props: {
      item: {
        type: Object,
      },
      row: {
        type: Object,
      },
      column: {
        type: Object,
      },
      $index: {
        type: Number,
      },
    },
    components: {
      BaseCopy: () => import('@/components/BaseCopy/index.vue'),
      Infos: () => import('../components/Infos.vue'),
      BaseStatus: () => import('@/components/BaseCopy/status.vue'),
      FilesSwiper: () => import('../components/FilesSwiper.vue')
    },
    methods: {
      getDateTime(time) {
        if (typeof time == 'number') {
          return moment(time * 1000).format('YYYY-MM-DD HH:mm');
        } else if (!isEmpty(time)) {
          return moment(time).format('YYYY-MM-DD HH:mm');
        } else {
          return time;
        }
      },
      switchChange(row, column, index) {
        this.$emit('switch-change', row, column, index);
      },
      disabledJudge(action) {
        const { disabled, auth = null } = action;
        if (auth && !this.$checkPermi(auth)) {
          return true;
        }
        if (typeof disabled === 'boolean') {
          return disabled;
        } else if (typeof disabled === 'function') {
          return disabled(this.row);
        } else {
          return false;
        }
      },
      getMoney(money) {
        if (!money) {
          return 0;
        } else if (money % 100 === 0) {
          return '￥' + (money / 100).toFixed(0);
        } else {
          return '￥' + (money / 100).toFixed(2);
        }
      },
      getRate(rate) {
        if (rate === undefined || rate === null) {
          return '--';
        } else if (rate === 0) {
          return 0;
        } else if (rate % 100 === 0) {
          return (rate / 100).toFixed(0) + '%';
        } else {
          return (rate / 100).toFixed(2) + '%';
        }
      },
      setStatusReason(item, row) {
        const { status } = item;
        if (status?.reason) {
          return typeof status.reason === 'function' ? String(status.reason(row)) : status.reason;
        }
        return undefined;
      },

      setStatusMapper(item, row) {
        const { status } = item;
        if (status?.mapper) {
          return status.mapper;
        }
        return {};
      },

      setStatusClass(item, row, field) {
        const { status } = item;
        if (status?.className) {
          if(typeof status.className === 'function'){
            return status.className(row);
          }else if(typeof status.className === 'object'){
            return status.className[row[field]];
          }else if(typeof status.className === 'string'){
            return status.className;
          }
        }
        return '';
      },
    },
  };
</script>
