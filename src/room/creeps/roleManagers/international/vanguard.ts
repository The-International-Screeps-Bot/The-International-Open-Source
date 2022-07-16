import { claimRequestNeedsIndex } from 'international/constants'
import { findObjectWithID, getRange, unpackAsPos } from 'international/generalFunctions'
import { Vanguard } from '../../creepClasses'

export function vanguardManager(room: Room, creepsOfRole: string[]) {
    // Loop through the names of the creeps of the role

    for (const creepName of creepsOfRole) {
        // Get the creep using its name

        const creep: Vanguard = Game.creeps[creepName]

        const claimTarget = Memory.rooms[creep.commune].claimRequest

        // If the creep has no claim target, stop

        if (!claimTarget) return

        Memory.claimRequests[Memory.rooms[creep.commune].claimRequest].needs[claimRequestNeedsIndex.vanguard] -=
            creep.parts.work

        creep.say(claimTarget)

        if (room.name === claimTarget) {
            creep.buildRoom()
            continue
        }

        // Otherwise if the creep is not in the claimTarget

        // Move to it

        creep.createMoveRequest({
            origin: creep.pos,
            goal: { pos: new RoomPosition(25, 25, claimTarget), range: 25 },
            avoidEnemyRanges: true,
            typeWeights: {
                enemy: Infinity,
                ally: Infinity,
                keeper: Infinity,
                commune: 1,
                neutral: 1,
                highway: 1,
            },
        })
    }
}

Vanguard.prototype.travelToSource = function (sourceName) {

    const { room } = this

    this.say('FHP')

    // Try to find a harvestPosition, inform false if it failed

    if (!this.findSourceHarvestPos(sourceName)) return false

    this.say('🚬')

    // Unpack the harvestPos

    const harvestPos = unpackAsPos(this.memory.packedPos)

    // If the creep is at the creep's packedHarvestPos, inform false

    if (getRange(this.pos.x, harvestPos.x, this.pos.y, harvestPos.y) === 0) return false

    // Otherwise say the intention and create a moveRequest to the creep's harvestPos, and inform the attempt

    this.say(`⏩ ${sourceName}`)

    this.createMoveRequest({
        origin: this.pos,
        goal: {
            pos: new RoomPosition(harvestPos.x, harvestPos.y, room.name),
            range: 0,
        },
        avoidEnemyRanges: true,
    })

    return true
}

Vanguard.prototype.buildRoom = function () {

    const { room } = this

    if (this.needsResources()) {
        // Define the creep's sourceName

        if (!this.findOptimalSourceName()) return

        const { sourceName } = this.memory

        // Try to move to source. If creep moved then iterate

        if (this.travelToSource(sourceName)) return

        // Try to normally harvest. Iterate if creep harvested

        if (this.advancedHarvestSource(room.get(sourceName))) return
        return
    }

    // If there is no construction target ID

    if (!room.memory.cSiteTargetID) {
        // Try to find a construction target. If none are found, stop

        room.findCSiteTargetID(this)
    }

    // Convert the construction target ID into a game object

    let constructionTarget = findObjectWithID(room.memory.cSiteTargetID)

    // If there is no construction target

    if (!constructionTarget) {
        // Try to find a construction target. If none are found, stop

        room.findCSiteTargetID(this)
    }

    // Convert the construction target ID into a game object, stopping if it's undefined

    constructionTarget = findObjectWithID(room.memory.cSiteTargetID)

    this.advancedBuildCSite(constructionTarget)
}
