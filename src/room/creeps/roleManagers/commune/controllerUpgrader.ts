export class ControllerUpgrader extends Creep {
    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    public get dying() {
        // Inform as dying if creep is already recorded as dying

        if (this._dying !== undefined) return this._dying

        // Stop if creep is spawning

        if (this.spawning) return false

        // If the creep's remaining ticks are more than the estimated spawn time plus travel time, inform false

        if (this.ticksToLive > this.body.length * CREEP_SPAWN_TIME + (this.room.upgradePathLength - 3)) return false

        // Record creep as dying

        return (this._dying = true)
    }

    preTickManager() {

        this.room.upgradeStrength += this.upgradeStrength
    }

    public static controllerUpgraderManager(room: Room, creepsOfRole: string[]) {
        // Loop through creepNames

        for (const creepName of creepsOfRole) {
            // Get the creep using its creepName

            const creep: ControllerUpgrader = Game.creeps[creepName]

            creep.advancedUpgradeController()
        }
    }
}
