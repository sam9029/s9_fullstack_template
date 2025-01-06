var model = require("../../../model/applet/user/wallet/index");
var dramaModel = require("../../../model/applet/user/wallet/drama_income");
var planModel = require("../../../model/applet/user/wallet/plan_income");

async function total(req, res) {
    model.total(req, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}
async function getIncomeByBusType(req, res) {
    model.getIncomeByBusType(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function getPlanIncome(req, res) {
    model.getPlanIncome(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}
async function withDraw(req, res) {
    model.withDraw(req, req.body, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}
async function totalIncome(req, res) {
    model.totalIncome(req, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}
async function withdrawLog(req, res) {
    model.withdrawLog(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function withDrawDetails(req, res) {
    model.withDrawDetails(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function withdrawLogDetails(req, res) {
    model.withdrawLogDetails(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function withdrawTypeCount(req, res) {
    model.withdrawTypeCount(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function rewithdraw(req, res) {
    model.rewithdraw(req.body, req.$user, req).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function dramaIncome(req, res) {
    dramaModel.dramaIncome(req.query,req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function dramaIncomeDetails(req, res) {
    dramaModel.dramaIncomeDetails(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function incomeDetails(req, res) {
    dramaModel.incomeDetails(req.query, req.$user, req).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function novelIncome(req, res) {
    dramaModel.novelIncome(req.query,req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function novelIncomeDetails(req, res) {
    dramaModel.novelIncomeDetails(req.query, req.$user, req).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function subIncomeDetails(req, res) {
    dramaModel.subIncomeDetails(req.query, req.$user, req).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function keywordSubDetails(req, res) {
    dramaModel.keywordSubDetails(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function planIncome(req, res) {
    planModel.planIncome(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function planIncomeDetails(req, res) {
    planModel.planIncomeDetails(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function h5Total(req, res) {
    model.h5Total(req, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function h5TotalIncome(req, res){
    model.h5TotalIncome(req, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function planIncomeTotal(req, res) {
    planModel.planIncomeTotal(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function planIncomeList(req, res) {
    planModel.planIncomeList(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}
async function planIncomeDetailsNew(req, res) {
    planModel.planIncomeDetailsNew(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}
async function planVideo(req, res) {
    planModel.planVideo(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}
module.exports = {
    total,
    getIncomeByBusType,
    withDraw,
    totalIncome,
    withdrawLog,
    withdrawLogDetails,
    withDrawDetails,
    withdrawTypeCount,
    rewithdraw,
    dramaIncome,
    dramaIncomeDetails,
    incomeDetails,
    keywordSubDetails,
    novelIncome,
    novelIncomeDetails,
    subIncomeDetails,
    planIncome,
    planIncomeDetails,
    getPlanIncome,
    h5Total,
    h5TotalIncome,
    planIncomeTotal,
    planIncomeList,
    planIncomeDetailsNew,
    planVideo
};