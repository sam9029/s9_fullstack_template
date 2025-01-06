var model = require("../../../model/applet/user/favorite")

async function list(req, res) {
    model.list(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function newList(req, res) {
    model.newList(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

module.exports = {
    list,
    newList
};