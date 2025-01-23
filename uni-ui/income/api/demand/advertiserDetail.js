import request from "@/utils/request.js";

// 汇总
export function getAdvertiserTotal(data) {
  const currentTab = data['currentTab'] || 0
  const url = currentTab == 0 ? '/applet/user/wallet/applet/wait_total' : '/applet/user/wallet/advertiser_plan_income_total'; 
  data['currentTab'] = null;
  return request({
    url: url,
    method: 'get',
    data
  })
}

// 任务列表
export function getIncomeList(data) {
  const currentTab = data['currentTab'] || 0
  const url = currentTab == 0 ? '/applet/user/wallet/applet/wait_list' : '/applet/user/wallet/advertiser_plan_income_list'; 
  data['currentTab'] = null;
  return request({
    url: url,
    method: 'get',
    data,
  });
}