const publicModel = require("../../model/public/callback");

exports.xunfei = async (req, res) => {
    publicModel
        .xunfei(req.query)
        .then((aptitude) => res.send(aptitude))
        .catch((err) => res.send(res.errorFormat(err)));
};
exports.wxpay = async (req, res) => {
    publicModel.wxpay(req.body, req.headers)
        .then((data) => res.send(data))
        .catch((err) => res.send(res.errorFormat(err)));
};
exports.alipay = async (req, res) => {
    publicModel
        .alipay(req.body, req.headers)
        .then((categroy) => res.send(categroy))
        .catch((err) => res.send(res.errorFormat(err)));
};
exports.wechat = async (req, res) => {
    publicModel
        .wechat(req.query, req.body, req.headers)
        .then((categroy) => res.send(categroy))
        .catch((err) => res.send(res.errorFormat(err)));
};

exports.douyin = async (req, res) => {
    publicModel.douyin(req.body, req.headers)
        .then((categroy) => res.send(categroy))
        .catch((err) => res.send(res.errorFormat(err)));
};

exports.apple = async (req, res) => {
    publicModel.apple(req.body, req.headers)
        .then((data) => res.send(data))
        .catch((err) => res.send(res.errorFormat(err)));
};
exports.xingtu = async (req, res) => {
    publicModel.xingtu(req.query, req.headers)
        .then((data) => res.send(data))
        .catch((err) => res.send(res.errorFormat(err)));
};
exports.xingtuToken = async (req, res) => {
    publicModel.xingtuToken(req.query, req.headers)
        .then((data) => res.send(data))
        .catch((err) => res.send(res.errorFormat(err)));
};
exports.duolai = async (req, res) => {
    publicModel.duolai(req)
        .then((data) => res.send(data))
        .catch((err) => res.send(res.errorFormat(err)));
};

exports.ali_auth = async (req, res) => {
    publicModel.ali_auth(req)
        .then((data) => res.send(data))
        .catch((err) => res.send(res.errorFormat(err)));
};

exports.duolai_upload = async (req, res) => {
    publicModel.duolai_upload(req)
        .then((data) => res.send(data))
        .catch((err) => {
            res.status(400).send({ code: 400, message: String(err.message || err || '未知错误') })
        });
};