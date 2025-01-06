import request from "@/utils/request.js";

// 回填记录列表
export function getBackfillList(data) {
  return new Promise((resolve, reject) => {
    resolve({
      code: 0,
      data: {
        list: [
          {
            id: 1746624614,
            platform_icon: "",
            platform_name:
              "抖音抖音抖音抖音抖音抖音抖音抖音抖音抖音抖音抖音抖音抖音",
            tag: "复仇爽剧",
            book_link: "https://www.baidu.com",
            date: "2021-08-10",
          },
          {
            id: 1746654614,
            platform_icon: "",
            platform_name: "抖音",
            tag: "复仇爽剧",
            book_link: "https://www.baidu.com",
            date: "2021-08-10",
          },
          {
            id: 1846624614,
            platform_icon: "",
            platform_name: "抖音",
            tag: "复仇爽剧",
            book_link: "https://www.baidu.com",
            date: "2021-08-10",
          },
          {
            id: 2746624614,
            platform_icon: "",
            platform_name: "抖音",
            tag: "复仇爽剧",
            book_link: "https://www.baidu.com",
            date: "2021-08-10",
          },
        ],
      },
    });
  });
}

// 新增
export function postPublishAdd(data) {
  return request({
    url: "",
    method: "post",
    data,
  });
}

// 编辑
export function postPublishUpdate(data) {
  return request({
    url: "",
    method: "post",
    data,
  });
}

// 详情
export function getPublishDef(data) {
  return request({
    url: "",
    method: "get",
    data,
  });
}

// 删除
export function postPublishDel(data) {
  return request({
    url: "",
    method: "post",
    data,
  });
}

// 配置字段
export function getPublishConfig(data) {
  // return request({
  //   url: '',
  //   method: 'get',
  //   data
  // })
  return new Promise((resolve, reject) => {
    resolve({
      code: 0,
      data: [
        {
          remark: null,
          prop_id: 11,
          required: true,
          label: "作品链接",
          prop: "opus_url",
          type: 3,
          comp_type: 1,
          dicts: null,
        },
        {
          remark: null,
          prop_id: 12,
          required: true,
          label: "作品类型",
          prop: "opus_type",
          type: 3,
          comp_type: 2,
          dicts: [
            {
              label: "视频",
              value: 1,
              id: 8,
            },
            {
              label: "图文",
              value: 2,
              id: 9,
            },
          ],
        },
        {
          remark: null,
          prop_id: 14,
          required: true,
          label: "发布日期",
          prop: "publish_date",
          type: 3,
          comp_type: 4,
          dicts: null,
        },
        {
          remark: null,
          prop_id: 15,
          required: true,
          label: "发布平台",
          prop: "platform_id",
          type: 3,
          comp_type: 3,
          dicts: null,
        },
        {
          remark: null,
          prop_id: 16,
          required: true,
          label: "平台账号",
          prop: "platform_primary_id",
          type: 3,
          comp_type: 3,
          dicts: null,
        },
      ],
    });
  });
}
