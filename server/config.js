module.exports.cliPort = 21026

module.exports.tickDuration = 10
module.exports.userCpu = 50;

module.exports.playerRooms = {"W1N1":'76561198255104702',"W1N7":"76561198178215469","W2N5":"76561198092401383"}
module.exports.rooms ={
     // "W1N1":'bot',
     // "W6N1":'bot',
     // "W2N5":'bot',
     // "W5N8":'bot',
     // "W7N3":'bot',
     // "W9N9":'bot',
     // "W3N9":'bot',
     // "W8N6":'bot',
     // "W3N3":'bot',
}
module.exports.trackedRooms= [
     // "W1N1",
     // "W5N8",
     // "W7N3",
     // "W2N5"
]

module.exports.milestones = [
     { tick: 10000, check: { level: 2 }, required:true },
     { tick: 15000, check: { level: 3 }, required:false },
     { tick: 45000, check: { level: 4 }, required:false },
]
