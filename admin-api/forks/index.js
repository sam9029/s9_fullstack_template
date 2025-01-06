
const fork = require('child_process').fork;
const { getCountWaitLock } = require('../db/redis')
const { RK_FROK_NUM_LOCK } = require('../config/redis_key')
//需要控制子进程的数量，子进程数量不得超过20个

async function forkModel(model, info = 0, path = null, expire_time = 20) {
    return new Promise((resolve, reject) => {
        try {
            let forkProcess = path ? fork(path) : fork(`./forks/${model}.js`);
            forkProcess.send(info);
            // 当一个子进程使用 process.send() 发送消息时会触发 'message' 事件
            let timmer = setTimeout(() => {
                clearTimeout(timmer)
                forkProcess.kill();
                return reject('任务执行超时20分钟，为保护系统稳定运行，已自动终止该任务！')
            }, expire_time * 60000);

            forkProcess.on('message', data => {
                // console.log({ data })
                forkProcess.kill();
                return resolve()
            });

            forkProcess.on('error', () => {
                forkProcess.kill();
                return resolve()
            });

            // 子进程监听到一些错误消息退出
            forkProcess.on('close', (code, signal) => {
                // console.log(`收到close事件，子进程收到信号 ${signal} 而终止，退出码 ${code}`);
                forkProcess.kill();
                return resolve()
            })
        } catch (error) {
            console.log('创建子进程异常！', error);
            return reject(error)
        }
    })

}

// 创建子进程
/**
 * 
 * @param {*} model 
 * @param {*} info 
 * @param {*} path 
 * @param {*} error_callback 
 * @param {Number} expire_time 任务执行超时时间，单位分钟
 * @returns 
 */
async function newFork(model, info = 0, path = null, error_callback = () => { }, expire_time = 20) {
    return await getCountWaitLock(RK_FROK_NUM_LOCK, 30, async () => {
        if (expire_time <= 0) return Promise.reject('超时时间异常，请检查设置！')
        return await forkModel(model, info, path, expire_time)
    }, 20, 1000).catch(err => {
        if (error_callback) error_callback(err)
        console.log('创建子进程异常：', err);
    })
}

module.exports = {
    newFork
}