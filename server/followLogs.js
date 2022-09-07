const { followLog, setHostname } = require("./helper");
const { playerRoom, trackedRooms } = require("./config");

async function main() {
  if (process.argv.length > 2) {
    setHostname(process.argv[2]);
  }
  followLog(trackedRooms, undefined, playerRoom);
}
main();
