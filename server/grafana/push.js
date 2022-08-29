const apiFunc = require('./apiFunctions.js')
const cron = require('node-cron')
require('dotenv').config({ path: `.env.grafana` })
const statsUsers = require('./users.js').users
const modifyRoomObjects = require('./modifyRoomObjects.js')
const handleServerStats = require('./handleServerStats.js')
var graphite = require('graphite')
var client = graphite.createClient('plaintext://relay:2003/')

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, prettyPrint } = format;

const logger = createLogger({
  format: combine(
    timestamp(),
    prettyPrint()
  ),
  transports: [new transports.File({ filename: "push.log" }, new transports.Console())],
})
function logInfo(message) {
    logger.log('info', message)
    console.log(message)
}
let groupedStats = {}

async function getLoginInfo(userinfo) {
    return userinfo.type === 'mmo'
        ? userinfo.token
        : await apiFunc.getPrivateServerToken(userinfo.username, userinfo.password)
}

function addPowerData(me) {
    return me.power || 0
}
async function addLeaderboardData(userinfo) {
    const leaderboard = await apiFunc.getLeaderboard(userinfo)
    if (!leaderboard) return { rank: 0, score: 0 }
    const leaderboardList = leaderboard.list
    if (leaderboardList.length === 0) return { rank: 0, score: 0 }
    const { rank, score } = leaderboardList.slice(-1)[0]
    return { rank, score }
}

async function getStats(userinfo, shard) {
    const stats = await apiFunc.getMemory(userinfo, shard)
    if (stats) await processStats(userinfo, shard, stats)
}

async function processStats(userinfo, shard, stats) {
    const me = await apiFunc.getUserinfo(userinfo)
    if (!me.error) stats.power = addPowerData(me)
    stats.leaderboard = await addLeaderboardData(userinfo)
    pushStats(userinfo, stats, shard)
}

function reportStats(stats) {
    client.write(stats, function (err) {
        if (err) console.log(err)
    })
}

function pushStats(userinfo, stats, shard) {
    groupedStats[userinfo.username] = userinfo.type === 'mmo' ? { [shard]: stats } : { shard: stats }
    logInfo(`${userinfo.type}: Added stats object for ${userinfo.username} in ${shard}`)
}

cron.schedule('*/15 * * * * *', async () => {
    console.log('----------------------------------------------------------------')
    groupedStats = {}
    for (let i = 0; i < statsUsers.length; i++) {
        try {
            const user = statsUsers[i]
            user.token = await getLoginInfo(user)
            const shouldContinue = new Date().getMinutes() % user.shards.length === 0
            if (user.type === 'mmo' && shouldContinue) continue
            for (let y = 0; y < user.shards.length; y++) {
                const shard = user.shards[y]
                await getStats(user, shard)
            }
        } catch (error) {}
    }

    const hasRunningPrivateServer = statsUsers.some(u => u.type === 'private')
    if (!hasRunningPrivateServer) {
        reportStats({ stats: groupedStats })
        logInfo('Pushed stats to graphite')
        return
    }

    try {
        const unfilteredUsers = await apiFunc.getUsers();
        const users = unfilteredUsers.filter(u => u.active === 10000)
        const roomsObjects = await apiFunc.getRoomsObjects()
        const modifiedRoomsObjects = modifyRoomObjects(roomsObjects)
        const serverStats = handleServerStats(users, modifiedRoomsObjects)


        reportStats({ stats: groupedStats, serverStats })
        logInfo(Object.keys(groupedStats) > 0 ? 'Pushed stats AND serverStats to graphite' : 'Pushed serverStats to graphite')
    } catch (e) {
        reportStats({ stats: groupedStats })
        logInfo('Pushed stats to graphite')
    }
})
