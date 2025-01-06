var model = require("../../../model/applet/user/account")

async function update(req, res) {
  model.update(req.body, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function updateAvatar(req, res) {
  model.updateAvatar(req, res).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function getRegion(req, res) {
  model.getRegion(req.query).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

// async function shareInfo(req, res) {
//   model.shareInfo(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
// }
async function operationNum(req, res) {
  model.operationNum(req.query, req.$user, req).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}
async function unsubscribe(req, res) {
  model.unsubscribe(req.body, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function checkBind(req, res) {
  model.checkBind(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function confirmBind(req, res) {
  model.confirmBind(req.body, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}
module.exports = {
  update,
  updateAvatar,
  getRegion,
  operationNum,
  unsubscribe,
  // shareInfo,
  checkBind,
  confirmBind,
};