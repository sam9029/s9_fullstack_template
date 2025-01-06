var express = require("express");
var router = express.Router();
const controller = require("../../../controller/applet/user/wallet");

router.get('/total', controller.total); // 收益汇总页面
router.get('/h5/total', controller.h5Total); // h5- 首页 我的收益
router.get('/h5/total_income', controller.h5TotalIncome); // h5-收益汇总
router.get('/business_income', controller.getIncomeByBusType); // 获取业务类型收益
router.post('/withdraw', controller.withDraw); // 提现
router.get('/total_income', controller.totalIncome); // 提现汇总
router.get('/withdraw_log', controller.withdrawLog); // 提现记录
router.get('/withdraw_details', controller.withDrawDetails); // 提现详情
router.get('/withdraw_log_details', controller.withdrawLogDetails);
router.get('/withdraw_type_count', controller.withdrawTypeCount); // 汇总查询
router.post('/rewithdraw', controller.rewithdraw); // 付款失败，重新提交提现申请

router.get('/promotion_income/drama', controller.dramaIncome);
router.get('/promotion_income/drama/details', controller.dramaIncomeDetails);
router.get('/promotion_income/drama/income_details', controller.incomeDetails);

router.get('/promotion_income/novel', controller.novelIncome);
router.get('/promotion_income/novel/details', controller.novelIncomeDetails);
router.get('/promotion_income/novel/income_details', controller.subIncomeDetails);
router.get('/promotion_income/novel/income_details/keyword', controller.keywordSubDetails); // 关键词收益

router.get('/promotion_income/plan', controller.planIncome);
router.get('/promotion_income/plan/details', controller.planIncomeDetails);

router.get('/promotion_income/plan_total', controller.planIncomeTotal); // 2024/1/9号新改版，推广计划收益
router.get('/promotion_income/plan_list', controller.planIncomeList); //
router.get('/promotion_income/plan_details', controller.planIncomeDetailsNew);
router.get('/promotion_income/plan_video', controller.planVideo);

router.get('/plan_income', controller.getPlanIncome); // 获取业务类型收益

exports.router = router;