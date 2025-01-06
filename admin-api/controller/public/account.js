const publicModel = require('../../model/public/account');

exports.edit = async (req, res) => {
    publicModel.edit(req.body, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
exports.changePassword = async (req, res) => {
    publicModel.changePassword(req.body, req.$user, req).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
exports.bindInviter = async (req, res) => {
    publicModel.bindInviter(req.body, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
exports.info = async (req, res) => {
    publicModel.info(req.body, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
// exports.platform = async (req, res) => {
//     publicModel.platform(req.query).then(platform => res.send(platform)).catch(err => res.send(res.errorFormat(err)));
// };