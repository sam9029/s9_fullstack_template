import request from '@/utils/request';

// 获取单个人银行卡
export function getBankInfo(params) {
  return request({
    url: '/public/bank/def',
    method: 'get',
    params,
  });
}

// 设置银行卡优先级
export function setBankSort(data) {
  return request({
    url: '/public/bank/sort',
    method: 'post',
    data,
  });
}

export function addBankInfo(data) {
  return request({
    url: '/public/bank/add',
    method: 'post',
    data,
  });
}

//修改银行账号
export function editBankInfo(data) {
  return request({
    url: '/public/bank/edit',
    method: 'post',
    data,
  });
}

//修改银行账号
export function bankCardList(params) {
  return request({
    url: '/manage/finance/bank_verify/list',
    method: 'get',
    params,
  });
}

//修改银行账号
export function bankDetails(params) {
  return request({
    url: '/manage/finance/bank_verify/details',
    method: 'get',
    params,
  });
}

//
export function remarkBankCard(data) {
  return request({
    url: '/manage/finance/bank_verify/remark',
    method: 'post',
    data,
  });
}

// 银行卡明细列表
export function bankDetailList(params) {
  return request({
    url: '/manage/finance/bank_verify/detail_list',
    method: 'get',
    params,
  });
}