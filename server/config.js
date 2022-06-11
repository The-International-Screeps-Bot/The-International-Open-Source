module.exports.cliPort = 21026

module.exports.verbose = false

module.exports.tickDuration = 10

module.exports.playerRoom = 'W1N1'
players = {
     W8N3: { x: 21, y: 28 },
     W2N5: { x: 33, y: 13 },
     W1N1: { x: 10, y: 9 },
     W2N2: { x: 10, y: 9 },
     W5N8: { x: 10, y: 9 },
}
module.exports.players = players
module.exports.rooms = Object.keys(players)

module.exports.milestones = [
     { tick: 10000, check: { level: 2 }, required:true },
     { tick: 15000, check: { level: 3 }, required:true },
     { tick: 45000, check: { level: 4 }, required:true },
]
