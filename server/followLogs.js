const { logConsole, followLog, setHostname } = require("./testHelpers");
const { playerRoom, rooms } = require("./testConfig");

async function main() {
  if (process.argv.length > 2) {
    setHostname(process.argv[2]);
  }
  followLog(rooms, logConsole, undefined, playerRoom);
}
main();
