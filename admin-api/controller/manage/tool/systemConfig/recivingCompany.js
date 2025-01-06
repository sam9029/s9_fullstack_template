const model = require("../../../../model/manage/tool/systemConfig/recivingCompany")

async function list(req, res) {
  model.list(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function add(req, res) {
  model.add(req.body, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function update(req, res) {
  model.update(req.body, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

module.exports = {
  list,
  add,
  update,
};