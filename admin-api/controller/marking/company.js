var model = require("../../model/marking/company")

async function tree(req, res) {
  model.tree(req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}
async function list(req, res) {
  model.list(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}
async function add(req, res) {
  model.add(req.body, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}
async function def(req, res) {
  model.def(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}
async function edit(req, res) {
  model.edit(req.body, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}
async function del(req, res) {
  model.del(req.body, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}
async function downList(req, res) {
  model.downList(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}
module.exports = {
  tree,
  list,
  add,
  def,
  edit,
  del,
  downList
};
