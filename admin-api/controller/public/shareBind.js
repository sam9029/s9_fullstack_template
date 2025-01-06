const publicModel = require("../../model/public/shareBind");

exports.shareInfo = async (req, res) => {
    publicModel
        .shareInfo(req.query)
        .then((data) => res.send(data))
        .catch((err) => res.send(res.errorFormat(err)));
};
exports.login = async (req, res) => {
    publicModel.login(req, res)
        .then((data) => res.send(data))
        .catch((err) => res.send(res.errorFormat(err)));
};
