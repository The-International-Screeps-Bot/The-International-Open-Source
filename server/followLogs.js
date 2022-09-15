import { followLog, setHostname } from "./helper";
import { playerRoom, trackedRooms } from "./config";

(async () => {
  if (process.argv.length > 2) {
    setHostname(process.argv[2]);
  }
  followLog(trackedRooms, undefined, playerRoom);
})()
