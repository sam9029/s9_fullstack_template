var model = require("../../../model/applet/user/invite")

async function activation_record(req, res) {
  model.activation_record(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function info(req, res) {
  model.info(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function total(req, res) {
  model.total(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}
async function list(req, res) {
  model.list(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}
module.exports = {
  list,
  info,
  total,
  activation_record
};