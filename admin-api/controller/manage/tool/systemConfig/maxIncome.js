const model = require("../../../../model/manage/tool/systemConfig/maxIncome")

exports.list = (req, res) => {
  model.list(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

exports.edit = (req, res) => {
  model.edit(req.body, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}
