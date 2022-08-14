const apiFunc = require('./apiFunctions.js')
const cron = require('node-cron')
require('dotenv').config({ path: `.env.grafana` })
const statsUsers = require('./users.js').users
const modifyRoomObjects = require('./modifyRoomObjects.js')
const handleServerStats = require('./handleServerStats.js')
var graphite = require('graphite')
var client = graphite.createClient('plaintext://relay:2003/')

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
     if (!me) return
     stats.power = addPowerData(me)
     stats.leaderboard = await addLeaderboardData(userinfo)
     pushStats(userinfo, stats, shard)
}

function reportStats(stats) {
     client.write(stats, function (err) {
          if (err) console.log(err)
     })
}

function pushStats(userinfo, stats, shard) {
     groupedStats[userinfo.username] = userinfo.type === 'mmo' ? { [shard]: stats } : stats
     console.log(`${userinfo.type}: Added stats object for ${userinfo.username} in ${shard}`)
}

function shouldContinue(shardsCount) {
     const seconds = 15 * Math.round(new Date().getSeconds() / 15)
     switch (shardsCount) {
          case 1:
               return true
          case 2:
               if (seconds === 0 || seconds === 30 || seconds === 60) return true
               return false
          case 3:
               if (seconds === 0 || seconds === 60) return true
               return false
          default:
               return false
     }
}

cron.schedule('*/5 * * * * *', async () => {
     console.log('----------------------------------------------------------------')
     groupedStats = {}
     for (let i = 0; i < statsUsers.length; i++) {
          const user = statsUsers[i]
          user.token = await getLoginInfo(user)
          if (user.type === 'mmo' && !shouldContinue(user.shards.length)) continue
          for (let y = 0; y < user.shards.length; y++) {
               const shard = user.shards[y]
               await getStats(user, shard)
          }
     }

     const hasRunningPrivateServer = statsUsers.some(u => u.type === 'private')
     if (!hasRunningPrivateServer) {
          reportStats({ stats: groupedStats })
          console.log('Pushed stats to graphite')
          return
     }

     try {
          const users = (await apiFunc.getUsers()).filter(u => u.active === 10000)
          let roomsObjects = await apiFunc.getRoomsObjects()
          const modifiedRoomsObjects = modifyRoomObjects(roomsObjects)
          const serverStats = handleServerStats(users,modifiedRoomsObjects)

          reportStats({ stats: groupedStats,serverStats })
          console.log('Pushed all stats to graphite')
     } catch (e) {
          console.log(e)
          reportStats({ stats: groupedStats })
          console.log('Pushed stats to graphite')
     }
})
