var model = require("../../../model/applet/user/publishRebate")

async function list(req, res) {
    model.list(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function basicList(req, res) {
    model.basicList(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function andBasicList(req, res) {
    model.andBasicList(req.body, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function monthList(req, res) {
    model.monthList(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function quarterList(req, res) {
    model.quarterList(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function yearList(req, res) {
    model.yearList(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function def(req, res) {
    model.def(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function andDef(req, res) {
    model.andDef(req.body, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function testDef(req, res) {
    model.testDef(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

module.exports = {
    list,
    basicList,
    andBasicList,
    monthList,
    quarterList,
    yearList,
    def,
    andDef,
    testDef,
};