import { AntifaAssaulter } from "room/creeps/creepClasses";
import { Quad } from "./quad";

export function antifaAssaulter(room: Room, creepsOfRole: string[]) {
    for (const creepName of creepsOfRole) {
         const creep: AntifaAssaulter = Game.creeps[creepName]

         // If no squad, try to make or find one

        if (!creep.squad) {

            if (!creep.findSquad()) continue
        }

        // If creep has a squad

        if (creep.squad instanceof Quad) {

            if (creep.name === creep.squad.assaulters[0].name) creep.squad.run()
            continue
        }

        if (creep.name === creep.squad.assaulter.name) creep.squad.run()
    }
}

AntifaAssaulter.prototype.findSquad = function() {

    return true
}
