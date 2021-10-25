export function harvesterManager(room: Room, creepsOfRole: Creep[]) {

    if (creepsOfRole.length == 0) return

    for (let creep of creepsOfRole) {

        creep.say("hey")
    }
}
