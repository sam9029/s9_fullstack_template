var model = require("../../model/marking/router")

async function tree(req, res) {
  model.tree(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
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
// async function dataTree(req, res) {
//   model.dataTree(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
// }
async function channel_tree(req, res) {
  model.channel_tree(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}
module.exports = {
  channel_tree,
  tree,
  list,
  add,
  def,
  edit,
  del,
  // dataTree
};