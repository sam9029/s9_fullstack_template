const model = require("../../../model/applet/public/index")


async function sharePlanToken(req, res) {
  model.sharePlanToken(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function sharePlanDef(req, res) {
  model.sharePlanDef(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

async function sharePlanPublish(req, res) {
  model.sharePlanPublish(req.body, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

module.exports = {
  sharePlanToken,
  sharePlanDef,
  sharePlanPublish
};