module.exports.cliPort = 21026;

module.exports.verbose = false;

module.exports.tickDuration = 10;

module.exports.playerRoom = "W6N1";
players = {
  W6N1: { x: 43, y: 35 },
  W8N3: { x: 21, y: 28 },
  W7N4: {x: 33, y: 13},
  W1N8: {x: 10, y: 9}
};
module.exports.players = players;
module.exports.rooms = Object.keys(players);

module.exports.milestones = [{  tick: 30, check: { creeps: 10 },required: true}];
module.exports.milestones = [{  tick: 50, check: { creeps: 15 },required: true}];
