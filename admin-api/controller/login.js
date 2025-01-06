const model = require('../model/login');

exports.login = (req, res) => {
    model.login(req, res)
        .then(data => res.send(data))
        .catch(err => res.send(res.errorFormat(err)));
};
exports.scanLogin = (req, res) => {
    model.scanLogin(req, res)
        .then(data => res.send(data))
        .catch(err => res.send(res.errorFormat(err)));
};
exports.scanAuth = (req, res) => {
    model.scanAuth(req, req.$user)
        .then(data => res.send(data))
        .catch(err => res.send(res.errorFormat(err)));
};
exports.scanLocation = (req, res) => {
    model.scanLocation(req, req.$user)
        .then(data => res.send(data))
        .catch(err => res.send(res.errorFormat(err)));
};
exports.loginCaptcha = (req, res) => {
    model.loginCaptcha(req, res)
        .then(data => res.send(data))
        .catch(err => res.send(res.errorFormat(err)));
};
exports.loginOut = (req, res) => {
    model.logout(req, req.$user)
        .then(data => res.send(data))
        .catch(err => res.send(res.errorFormat(err)));
};
exports.concatInfo = (req, res) => {
    model.concatInfo(req, res)
        .then(data => res.send(data))
        .catch(err => res.send(res.errorFormat(err)));
};
exports.sendSmsByType = (req, res) => {
    model.sendSmsByType(req.body, req)
        .then(data => res.send(data))
        .catch(err => res.send(res.errorFormat(err)));
};
exports.checkSmsByType = (req, res) => {
    let token = req.headers.token || req.cookies.token || ''
    model.checkSmsByType(req.body, token, req)
        .then(data => res.send(data))
        .catch(err => res.send(res.errorFormat(err)));
};
exports.register = (req, res) => {
    model.register(req)
        .then(data => res.send(data))
        .catch(err => res.send(res.errorFormat(err)));
};

exports.getPhoneNumber = (req, res) => {
    model.getPhoneNumber(req.query, res).then(data => res.send(data))
        .catch(err => res.send(res.errorFormat(err)));
};
exports.getWXToken = (req, res) => {
    model.getWXToken(req.query, res).then(data => res.send(data))
        .catch(err => res.send(res.errorFormat(err)));
};
exports.getDouYinToken = (req, res) => {
    model.getDouYinToken(req.query, res).then(data => res.send(data))
        .catch(err => res.send(res.errorFormat(err)));
};
exports.getWXOAToken = (req, res) => {
    model.getWXOAToken(req.query, res).then(data => res.send(data))
        .catch(err => res.send(res.errorFormat(err)));
};
exports.screenshot = (req, res) => {
    model.screenshot(req.query, res).then(data => res.send(data))
        .catch(err => res.send(res.errorFormat(err)));
};
exports.getConcat = (req, res) => {
    model.getConcat(req.query, req.$user)
        .then(data => res.send(data))
        .catch(err => res.send(res.errorFormat(err)));
};
exports.getSlideCode = (req, res) => {
    model.getSlideCodes(res)
        .then(data => res.send(data))
        .catch(err => res.send(res.errorFormat(err)));
};
exports.unifiedLogin = (req, res) => {
    model.unifiedLogin(req, res)
        .then(data => res.send(data))
        .catch(err => res.send(res.errorFormat(err)));
};
