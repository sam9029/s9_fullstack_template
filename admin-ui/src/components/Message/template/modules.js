import moment from "moment";
 
export function getSubTypeMsgModel(subType) {
  switch(subType) {
    case 101:
      return keywordVerifyModel();
    case 102:
      return writingVerifyModel();
    case 505:
      return popularizeContentNotifyModel();
    default:
      return defaultModel();
  }
}

function keywordVerifyModel() {
  const now = moment().format('YYYY-MM-DD HH:mm');
  return {
    verify_time: now,
    remark: `${now}之后提交的关键词将于下期提交审核`,
  };
}

function writingVerifyModel() {
  const now = moment().format('YYYY-MM-DD HH:mm');
  return {
    verify_time: now,
    remark: `${now}之后发布的作品将于下期提交审核`,
  };
}

function popularizeContentNotifyModel() {
  const now = moment().format('YYYY-MM-DD HH:mm');
  return {
    content: "",
    create_time: now,
    remark: "",
  };
}

function defaultModel() {
  const now = moment().format('YYYY-MM-DD HH:mm');
  return {
    create_time: now,
    remark: "",
  };
}


export const SUB_TYPES = new Set([/* 101, */ 102, 501, /* 502, */ 503, 504, 505, 701, 702]);