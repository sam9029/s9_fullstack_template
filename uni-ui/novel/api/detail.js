import request from "@/utils/request.js";

export function getXGDetail(data) {
  return request({
    url: "/applet/popularize/qr_task/xingguang/define",
    method: "get",
    data,
  });
}

export function getDetailList(data) {
  return new Promise((resolve, reject) => {
    resolve({
      code: 0,
      data: {
        list: [
          {
            id: 1,
            title: '等会叫我的奇偶位',
            verify_status: 1,
            verify_suggest: "",
            date: '2021-08-10 10:00:00',
          },
          {
            id: 2,
            title: '等会叫我的奇偶位',
            verify_status: 2,
            verify_suggest: "",
            date: '2021-08-10 10:00:00',
          },
          {
            id: 3,
            title: '等会叫我的奇偶位',
            verify_status: 3,
            verify_suggest: "测阿达伟大",
            date: '2021-08-10 10:00:00',
          },
          {
            id: 4,
            title: '等会叫我的奇偶位',
            verify_status: 1,
            verify_suggest: "",
            date: '2021-08-10 10:00:00',
          },
          {
            id: 5,
            title: '等会叫我的奇偶位',
            verify_status: 3,
            verify_suggest: "达瓦达瓦",
            date: '2021-08-10 10:00:00',
          },
          
        ]
      }
    })
  })
}


// 账号报名
export function postXGRegister(data) {
  return request({
    url: "/applet/popularize/qr_task/xingguang/register",
    method: "post",
    data
  })
}

// 删除
export function postDeleteLibray(data) {
  return request({
    url: '',
    method: 'post',
    data
  })
}

// 提词详情
export function getSingKeywordDef(data) {
  // return request({
  //   url: '',
  //   method: 'get',
  //   data
  // })
  return new Promise((resolve, reject) => {
    resolve({
      code: 0,
      data: {
        id: 1,
        title: '等会叫我的奇偶位',
        book_name: "几大万i后",
        auth: '韩国',
        book_id: 464163,
        book_link: 'https://www.baidu.com',
        desc: "多久哦AWDJP去海南啦。代码wide的骄傲DKWEPDHi扣了我大家OQW的期望；多靠谱去我的空间萨拉丁抛弃我们的啊大家陪我到外网的了觉得马力可达Koop稳定看大为爱的恐怕都打我买了",
        verify_status: 1,
        verify_suggest: "",
        date: '2021-08-10 10:00:00',
      },
    })
  })
}