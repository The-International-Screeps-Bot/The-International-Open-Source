import { AntifaAssaulter } from "room/creeps/creepClasses";
import { Duo } from "./duo";
import { Quad } from "./quad";

export function antifaAssaulterManager(room: Room, creepsOfRole: string[]) {
    for (const creepName of creepsOfRole) {
         const creep: AntifaAssaulter = Game.creeps[creepName]

         // If no squad, try to make or find one

        if (!creep.squad && creep.memory.squadType) {

            if (!creep.findSquad()) continue
        }

        // Quad

        if (creep.squad instanceof Quad) {

            if (creep.name === creep.squad.assaulters[0].name) creep.squad.run()
            continue
        }

        // Duo

        if (creep.squad instanceof Duo) {

            if (creep.name === creep.squad.assaulter.name) creep.squad.run()
            continue
        }

        // Single


    }
}

AntifaAssaulter.prototype.findSquad = function() {

    return true
}

AntifaAssaulter.prototype.runSingle = function() {

    
}
