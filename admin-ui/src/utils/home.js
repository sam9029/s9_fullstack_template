import moment from 'moment';
import { Notification } from 'element-ui';
moment.locale('zh-cn');

import {
  getMonthStartDate,
  getToday,
  getLastMonthStartDate,
  getLastMonthEndDate,
} from '@/utils/common/tools';

export function getFormatTime(data) {
  const today = moment().format('YYYY-MM-DD');
  const week = moment().subtract(7, 'd').format('YYYY-MM-DD');
  const yesterday = moment().subtract(1, 'd').format('YYYY-MM-DD');
  const month = moment().subtract(30, 'd').format('YYYY-MM-DD');

  if (data === 'today') {
    return [today, today];
  } else if (data === 'yesterday') {
    return [yesterday, yesterday];
  } else if (data === 'seven') {
    return [week, yesterday];
  } else if (data === 'thirty') {
    return [month, yesterday];
    // 本周
  } else if (data === 'thisWeek') {
    let starts = moment().startOf('week').format('YYYY-MM-DD'); //周一
    let ends = moment().endOf('week').format('YYYY-MM-DD'); //周日
    return [starts, ends];
    // 上周
  } else if (data === 'lastWeek') {
    let starts = moment(new Date()).subtract(1, 'weeks').startOf('week').format('YYYY-MM-DD');
    let ends = moment(new Date()).subtract(1, 'weeks').endOf('week').format('YYYY-MM-DD');
    return [starts, ends];
    // 本月
  } else if (data === 'thisMonth') {
    let starts = moment().startOf('month').format('YYYY-MM-DD');
    let ends = moment().endOf('month').format('YYYY-MM-DD');
    return [starts, ends];
    // 上月
  } else if (data === 'lastMonth') {
    let starts = moment(new Date()).subtract(1, 'months').startOf('month').format('YYYY-MM-DD');
    let ends = moment(new Date()).subtract(1, 'months').endOf('month').format('YYYY-MM-DD');
    return [starts, ends];
  }
}
export const dateOptions = [
  {
    value: 'today',
    label: '今天',
  },
  {
    value: 'yesterday',
    label: '昨天',
  },
  {
    value: 'seven',
    label: '近7天',
  },
  {
    value: 'thirty',
    label: '近30天',
  },
  {
    value: 'thisWeek',
    label: '本周',
  },
  {
    value: 'lastWeek',
    label: '上周',
  },
  {
    value: 'thisMonth',
    label: '本月',
  },
  {
    value: 'lastMonth',
    label: '上月',
  },
];

export const pickerOptions = {
  shortcuts: [
    {
      text: '今天',
      onClick(picker) {
        picker.$emit('pick', [new Date(), new Date()]);
      },
    },
    {
      text: '昨天',
      onClick(picker) {
        const date = new Date();
        date.setTime(date.getTime() - 3600 * 1000 * 24);
        picker.$emit('pick', [date, date]);
      },
    },
    {
      text: '近3天',
      onClick(picker) {
        const start_date = new Date();
        start_date.setTime(start_date.getTime() - 3600 * 1000 * 24 * 2);
        picker.$emit('pick', [start_date, new Date()]);
      },
    },
    {
      text: '近7天',
      onClick(picker) {
        const start_date = new Date();
        start_date.setTime(start_date.getTime() - 3600 * 1000 * 24 * 6);
        picker.$emit('pick', [start_date, new Date()]);
      },
    },
    {
      text: '近30天',
      onClick(picker) {
        const start_date = new Date();
        start_date.setTime(start_date.getTime() - 3600 * 1000 * 24 * 29);
        picker.$emit('pick', [start_date, new Date()]);
      },
    },
    {
      text: '本周',
      onClick(picker) {
        const start_date = new Date();
        const nowDayOfWeek = start_date.getDay();
        start_date.setTime(start_date.getTime() - 3600 * 1000 * 24 * (nowDayOfWeek - 1));
        const end_date = new Date();
        picker.$emit('pick', [start_date, end_date]);
      },
    },
    {
      text: '上周',
      onClick(picker) {
        const start_date = new Date();
        const nowDayOfWeek = start_date.getDay();
        start_date.setTime(start_date.getTime() - 3600 * 1000 * 24 * (nowDayOfWeek - 1 + 7));
        const end_date = new Date();
        end_date.setTime(end_date.getTime() - 3600 * 1000 * 24 * nowDayOfWeek);
        picker.$emit('pick', [start_date, end_date]);
      },
    },
    {
      text: '本月',
      onClick(picker) {
        picker.$emit('pick', [getMonthStartDate(), getToday()]);
      },
    },
    {
      text: '上月',
      onClick(picker) {
        picker.$emit('pick', [getLastMonthStartDate(), getLastMonthEndDate()]);
      },
    },
  ],
};

export function compare(p) {
  //这是比较函数
  return function (m, n) {
    var a = m[p];
    var b = n[p];
    return b - a; //升序
  };
}

export const handleChartSearchNotify = (_mag) => {
  Notification.closeAll();
  Notification({
    type: 'warning',
    title: _mag || '未知错误',
    offset: 65, // 向下偏移-防止阻挡TopNav菜单
    customClass: 'chart-search-notify',
    duration: 3000,
  });
};
