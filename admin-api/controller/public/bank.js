const publicModel = require("../../model/public/bank");

exports.list = async (req, res) => {
    publicModel
        .list(req.query, req.$user)
        .then((aptitude) => res.send(aptitude))
        .catch((err) => res.send(res.errorFormat(err)));
};
exports.sign = async (req, res) => {
    publicModel.sign(req.body, req.$user)
        .then((data) => res.send(data))
        .catch((err) => res.send(res.errorFormat(err)));
};
exports.save = async (req, res) => {
    publicModel
        .save(req)
        .then((categroy) => res.send(categroy))
        .catch((err) => res.send(res.errorFormat(err)));
};
exports.def = async (req, res) => {
    publicModel
        .def(req.query, req.$user)
        .then((data) => { res.send(data) })
        .catch((err) => res.send(res.errorFormat(err)));
};

exports.edit = async (req, res) => {
    publicModel
        .edit(req.body, req.$user)
        .then((data) => res.send(data))
        .catch((err) => res.send(res.errorFormat(err)));
};

exports.sort = async (req, res) => {
    publicModel
        .editSort(req.body, req.$user)
        .then((data) => res.send(data))
        .catch((err) => res.send(res.errorFormat(err)));
};

exports.verifyInfo = async (req, res) => {
    publicModel
        .verifyInfo(req.query, req.$user)
        .then((data) => { res.send(data) })
        .catch((err) => res.send(res.errorFormat(err)));
};

exports.record = async (req, res) => {
    publicModel
        .getIncomeRecord(req.query, req.$user)
        .then((data) => { res.send(data) })
        .catch((err) => res.send(res.errorFormat(err)));
};
exports.getPaymentInfo = async (req, res) => {
    publicModel
        .getPaymentInfo(req.body, req.$user)
        .then((data) => { res.send(data) })
        .catch((err) => res.send(res.errorFormat(err)));
};

exports.unbind = async (req, res) => {
    publicModel
        .unbind(req.body, req.$user)
        .then((data) => res.send(data))
        .catch((err) => res.send(res.errorFormat(err)));
};

exports.check = async (req, res) => {
    publicModel.check(req.body, req.$user)
        .then((data) => res.send(data))
        .catch((err) => res.send(res.errorFormat(err)));
};