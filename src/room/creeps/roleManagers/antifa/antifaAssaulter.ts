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

        creep.runSingle()
    }
}

AntifaAssaulter.prototype.findSquad = function() {

    return true
}

AntifaAssaulter.prototype.runSingle = function() {

    const { room } = this

    this.passiveHeal()

    // In attackTarget

    if (this.memory.attackTarget === room.name) {

        // rangedAttack

        if (this.memory.squadType === 'rangedAttack') {

            this.advancedRangedAttack()
            return
        }

        // attack

        if (this.memory.squadType === 'attack') {

            this.advancedAttack()
            return
        }

        // dismantle

        this.advancedDismantle()
        return
    }

    // In the commune

    if (this.memory.communeName === this.name) {

        // Go to the attackTarget

        this.createMoveRequest({
            origin: this.pos,
            goal: {
                 pos: new RoomPosition(25, 25, this.memory.attackTarget),
                 range: 25,
            },
       })
        return
    }


    // In a non-attackTarget or commune room

    // Go to the attackTarget

    this.createMoveRequest({
        origin: this.pos,
        goal: {
                pos: new RoomPosition(25, 25, this.memory.attackTarget),
                range: 25,
        },
    })
}

AntifaAssaulter.prototype.advancedRangedAttack = function() {

    
}

AntifaAssaulter.prototype.advancedAttack = function() {


}

AntifaAssaulter.prototype.advancedDismantle = function() {


}
