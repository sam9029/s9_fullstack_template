const schedule = require('node-schedule');
const { newFork } = require('./forks/index')
// const { SyncAdvertiserData } = require("./forks/externalData")
function scheduleJobs() {

}

exports.production = () => {
    if (process.env.NODE_ENV == "production") {
        scheduleJobs()
    }
}
