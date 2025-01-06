var model = require("../../../model/applet/user/message")

async function list(req, res) {
    model.list(req, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function def(req, res) {
    model.def(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function typeList(req, res) {
    model.typeList(req, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

module.exports = {
    list,
    def,
    typeList,
};