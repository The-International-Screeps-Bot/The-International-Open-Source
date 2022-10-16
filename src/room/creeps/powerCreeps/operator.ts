export class Operator extends PowerCreep {
    constructor(creepID: Id<PowerCreep>) {
        super(creepID)
    }

    preTickManager() {


    }

    runTasks?() {

        if (this.advancedRenew()) return true
        if (this.advancedEnablePower()) return true

        return false
    }

    runTask?() {


    }

    findTask?() {


    }

    advancedRenew?() {

        // Too old to renew

        if (this.ticksToLive > POWER_CREEP_LIFE_TIME * 0.1) return false

        const powerSpawn = this.room.structures.powerSpawn[0]
        if (!powerSpawn) return false

        return true
    }

    advancedEnablePower?() {

        if (!this.room.controller) return false

        if (this.room.controller.isPowerEnabled) return false

        return true
    }

    static operatorManager(room: Room, creepsOfRole: string[]) {

        // Loop through creep names of this role

        for (const creepName of creepsOfRole) {
            // Get the creep using its name

            const creep: Operator = Game.powerCreeps[creepName]

            creep.runTasks()
        }
    }
}
