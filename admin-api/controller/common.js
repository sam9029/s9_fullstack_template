const model = require('../model/common');

exports.taskHall = (req, res) => {
    model.taskHall(req).then(data => res.send(data))
        .catch(err => res.send(res.errorFormat(err)));
};
exports.taskDetial = (req, res) => {
    model.taskDetial(req).then(data => res.send(data))
        .catch(err => res.send(res.errorFormat(err)));
};
