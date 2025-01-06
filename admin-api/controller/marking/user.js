var model = require("../../model/marking/user")

// async function dailyList(req, res) {
// 	let model = req._model;
// 	model.dailyList(req.query, req.$user).then(data => res.send(data)).catch(err => res.send({code: 1,  message: err.message, err}));
// }
// async function dailyTotal(req, res) {
// 	let model = req._model;
// 	model.dailyTotal(req.query, req.$user).then(data => res.send(data)).catch(err => res.send({code: 1,  message: err.message, err}));
// }
async function info(req, res) {
  model.info(req.$user, req.query.platform || 'pc').then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}
async function router(req, res) {
  model.router(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}
async function rePush(req, res) {
  model.rePush(req.body, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
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
async function permsMapper(req, res) {
  model.permsMapper(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}
async function upperUser(req, res) {
  model.upperUser(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}
async function roleAuthTree(req, res) {
  model.roleAuthTree(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}
async function kocTree(req, res) {
  model.kocTree(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}
async function subUser(req, res) {
  model.subUser(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}
async function downList(req, res) {
  model.userDownList(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function blogLeader(req, res) {
  model.blogLeader(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function roleUser(req, res) {
  model.roleUser(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function updateBankInfo(req, res) {
  model.updateBankInfo(req.body, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function updatePassword(req, res) {
  model.updatePassword(req.body, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function avatar(req, res) {
  model.avatar(req, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function setOpenId(req, res) {
  model.setOpenId(req.body, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function fingerprint(req, res) {
  model.fingerprint(req, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}
module.exports = {
  info,
  router,
  rePush,
  list,
  add,
  def,
  edit,
  del,
  permsMapper,
  upperUser,
  roleAuthTree,
  kocTree,
  subUser,
  downList,
  blogLeader,
  roleUser,
  updateBankInfo,
  updatePassword,
  avatar,
  setOpenId,
  fingerprint
};
