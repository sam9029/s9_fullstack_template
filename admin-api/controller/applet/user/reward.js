var model = require("../../../model/applet/user/reward")

async function list(req, res) {
    model.list(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function def(req, res) {
    model.def(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function andList(req, res) {
    model.list(req.body, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function andDef(req, res) {
    model.def(req.body, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

module.exports = {
    list,
    def,
    andList,
    andDef,
};