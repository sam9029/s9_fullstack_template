var model = require("../../../model/applet/user/realname")

async function makeCertifyId(req, res) {
    model.makeCertifyId(req.body, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}
async function getCertifyResult(req, res) {
    model.getCertifyResult(req.body, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}
module.exports = {
    makeCertifyId,
    getCertifyResult
};