const publicModel = require("../../model/public/downloadTemplate");

exports.list = async (req, res) => {
  publicModel
    .list(req.query)
    .then((aptitude) => res.send(aptitude))
    .catch((err) => res.send(res.errorFormat(err)));
};
exports.add = async (req, res) => {
  publicModel
    .add(req, res)
    .then((region) => res.send(region))
    .catch((err) => res.send(res.errorFormat(err)));
};
exports.save = async (req, res) => {
  publicModel
    .save(req)
    .then((categroy) => res.send(categroy))
    .catch((err) => res.send(res.errorFormat(err)));
};
exports.get = async (req, res) => {
  publicModel
    .get(req.query, res)
    .then((data) => { })
    .catch((err) => res.send(res.errorFormat(err)));
};

exports.edit = async (req, res) => {
  publicModel
    .edit(req)
    .then((data) => res.send(data))
    .catch((err) => res.send(res.errorFormat(err)));
};

exports.download = async (req, res) => {
  publicModel
    .download(req.query)
    .then((data) => res.send(data))
    .catch((err) => res.send(res.errorFormat(err)));
};
