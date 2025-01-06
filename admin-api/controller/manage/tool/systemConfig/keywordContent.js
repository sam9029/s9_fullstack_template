const model = require("../../../../model/manage/tool/systemConfig/keywordContent")

exports.list = (req, res) => {
  model.list(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

exports.add = (req, res) => {
  model.add(req.body, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

exports.edit = (req, res) => {
  model.edit(req.body, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

exports.importData = (req, res) => {
  model.importData(req.body, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

exports.def = (req, res) => {
  model.def(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}
exports.defUrl = (req, res) => {
  model.defUrl(req.body, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

exports.updateStatus = (req, res) => {
  model.updateStatus(req.body, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}
exports.defBookId = (req, res) => {
  model.defBookId(req.body, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}