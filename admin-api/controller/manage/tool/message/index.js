const model = require("../../../../model/manage/tool/message/index")

exports.list = (req, res) => {
  model.list(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

exports.add = (req, res) => {
  model.add(req.body, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

exports.def = (req, res) => {
  model.def(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

exports.del = (req, res) => {
  model.del(req.body, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

exports.update = (req, res) => {
  model.update(req.body, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}