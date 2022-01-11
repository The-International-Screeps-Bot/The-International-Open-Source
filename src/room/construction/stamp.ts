import { constants } from "international/constants"

export interface Stamp {
    type: StampTypes
    room: Room
    anchorReference: Pos
    dimensions: number
    anchor: Pos
    // Functions

    plan(baseCM: CostMatrix, buildObjects: BuildObj[]): false | {[key: string]: CostMatrix | BuildObj[]}
}

export class Stamp {
    constructor(type: StampTypes, room: Room, anchorReference: Pos) {

        const stamp = this

        stamp.type = type
        stamp.room = room
        stamp.anchorReference = anchorReference
    }
}

Stamp.prototype.plan = function(baseCM, buildObjects) {

    const stamp = this
    const room = stamp.room

    // Run distance transform with the baseCM

    const distanceCM = room.specialDT(baseCM)

    // Get the dimensions of the stamp

    const stampDimensions = constants.stamps[stamp.type].dimensions

    // Try to generate a stampAnchor

    const stampAnchor = room.findClosestPosOfValue(distanceCM, stamp.anchorReference, stampDimensions / 2)

    // Stop if a stamp anchor wasn't generated

    if (!stampAnchor) return false

    // Otherwise construct offset values

    const offsetX = stampAnchor.x - Math.floor(stampDimensions / 2)
    const offsetY = stampAnchor.y - Math.floor(stampDimensions / 2)

    // Get the structures for the stamp

    const stampStructures = constants.stamps[stamp.type].structures

    // Loop through structure types in fastFiller structures

    for(const structureType in stampStructures) {

        // Get the positions for this structre type

        const positions = stampStructures[structureType]

        // Loop through positions

        for (const pos of positions) {

            // Get the proper x and y using the offset and stamp radius

            const x = pos.x + offsetX
            const y = pos.y + offsetY

            // If the structure isn't a road

            if (structureType != STRUCTURE_ROAD) {

                // Add the pos to the base cost matrix as avoid

                baseCM.set(x, y, 255)
            }

            // Add the structureType and position info to buildObjects

            buildObjects.push({
                structureType: structureType,
                x: x,
                y: y
            })


            // Display visuals if enabled

            if (Memory.roomVisuals) room.visual.circle(x, y, constants.styleForStructureTypes[structureType])
        }
    }

    return {
        baseCM,
        buildObjects
    }
}
