import { allyList, myColors, safemodeTargets } from 'international/constants'
import { customLog, findObjectWithID } from 'international/generalFunctions'

Room.prototype.defenceManager = function () {
    // If CPU logging is enabled, get the CPU used at the start

    if (Memory.CPULogging) var managerCPUStart = Game.cpu.getUsed()

    this.advancedActivateSafeMode()
    this.manageRampartPublicity()

    // If CPU logging is enabled, log the CPU used by this manager

    if (Memory.CPULogging)
        customLog('Defence Manager', (Game.cpu.getUsed() - managerCPUStart).toFixed(2), undefined, myColors.lightGrey)
}

Room.prototype.manageRampartPublicity = function () {
    const enemyAttackers = this.enemyAttackers.filter(function (creep) {
        return !creep.isOnExit()
    })

    // If there are no enemyAttackers, try to publicize private ramparts 10 at a time

    if (!enemyAttackers.length) {
        if (!Memory.publicRamparts) return

        // Stop if the tick is not divisible by a random range

        if (Game.time % Math.floor(Math.random() * 50) !== 0) return

        // Publicize at most 10 ramparts per tick, to avoid too many intents

        let intents = 0

        for (const rampart of this.structures.rampart) {
            if (intents >= 10) return

            // If the rampart is public

            if (rampart.isPublic) continue

            // Otherwise set the rampart to public, increase increment

            rampart.setPublic(true)
            intents += 1
        }

        // Stop

        return
    }

    // If there are enemyAttackers, privitize all ramparts that are public

    for (const rampart of this.structures.rampart) if (rampart.isPublic) rampart.setPublic(false)
}

Room.prototype.advancedActivateSafeMode = function () {
    // If safeMode is on cooldown, stop

    if (this.controller.safeModeCooldown) return

    // Otherwise if there are no safeModes left, stop

    if (this.controller.safeModeAvailable === 0) return

    // Otherwise if the controller is upgradeBlocked, stop

    if (this.controller.upgradeBlocked > 0) return

    // Filter attackers that are not invaders. If there are none, stop

    const nonInvaderAttackers = this.enemyAttackers.filter(
        enemyCreep => !enemyCreep.isOnExit() && enemyCreep.owner.username /* !== 'Invader' */,
    )

    if (!nonInvaderAttackers.length) return

    // Otherwise if safeMode can be activated

    // Get the previous tick's events

    const eventLog = this.getEventLog()

    // Loop through each eventItem

    for (const eventItem of eventLog) {
        // If the event wasn't an attack, iterate

        if (eventItem.event !== EVENT_ATTACK) continue

        // Otherwise get the target of the attack

        const attackTarget = findObjectWithID(eventItem.data.targetId as Id<Structure | any>)

        // If the attackTarget isn't a structure, iterate

        if (!(attackTarget instanceof Structure)) continue

        if (!safemodeTargets.includes(attackTarget.structureType)) continue

        this.controller.activateSafeMode()
        return
    }
}
