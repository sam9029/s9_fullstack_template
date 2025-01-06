const publicModel = require('../../model/public/automaticRule');

exports.list = async (req, res) => {
    publicModel.list(req.query, req.$user)
        .then(data => res.send(data))
        .catch(err => res.send(res.errorFormat(err)));
};
exports.add = async (req, res) => {
    publicModel.add(req.body, req.$user)
        .then(data => res.send(data))
        .catch(err => res.send(res.errorFormat(err)));
};
exports.save = async (req, res) => {
    publicModel.save(req.body, req.$user)
        .then(categroy => res.send(categroy))
        .catch(err => res.send(res.errorFormat(err)));
};
exports.get = async (req, res) => {
    publicModel.get(req.query, res)
        .then(categroy_media => { })
        .catch(err => res.send(res.errorFormat(err)));
};
