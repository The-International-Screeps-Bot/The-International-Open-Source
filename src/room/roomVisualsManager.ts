import { allyList, myColors, NORMAL, PROTECTED, roomDimensions, stamps } from 'international/constants'
import { customLog, findObjectWithID, unpackAsPos } from 'international/generalFunctions'

Room.prototype.roomVisualsManager = function () {
    // Stop if roomVisuals are disabled

    if (!Memory.roomVisuals) return

    // If CPU logging is enabled, get the CPU used at the start

    if (Memory.cpuLogging) var managerCPUStart = Game.cpu.getUsed()

    // If there is an anchor, show a rectangle around it

    if (this.anchor)
        this.visual.rect(this.anchor.x - 0.5, this.anchor.y - 0.5, 1, 1, {
            stroke: myColors.lightBlue,
            fill: 'transparent',
        })
    ;(() => {
        // Stop if there is no controller

        if (!this.controller) return

        // If the controller is mine

        if (this.controller.my) {
            // If the controller level is less than 8, show percentage to next level

            if (this.controller.level < 8)
                this.visual.text(
                    `%${((this.controller.progress / this.controller.progressTotal) * 100).toFixed(2)}`,
                    this.controller.pos.x,
                    this.controller.pos.y - 1,
                    {
                        backgroundColor: 'rgb(255, 0, 0, 0)',
                        font: 0.5,
                        opacity: 1,
                        color: myColors.lightBlue,
                    },
                )

            // Show the controller's level

            this.visual.text(`${this.controller.level}`, this.controller.pos, {
                backgroundColor: 'rgb(255, 0, 0, 0)',
                font: 0.5,
                opacity: 0.8,
            })
            return
        }

        // If the controller is reserved

        if (this.controller.reservation) {
            // Define the reservationColor based on some conditions

            const color = () => {
                if (this.controller.reservation.username === Memory.me) {
                    return myColors.lightBlue
                }

                if (Memory.allyList.includes(this.controller.reservation.username)) {
                    return myColors.green
                }

                return myColors.red
            }

            // Show the reservation time

            this.visual.text(`${this.controller.reservation.ticksToEnd}`, this.controller.pos, {
                backgroundColor: 'rgb(255, 0, 0, 0)',
                font: 0.5,
                opacity: 0.8,
                color: color(),
            })
        }
    })()
    ;(() => {
        // Get the spawns in the room

        const spawns = this.structures.spawn

        // Loop through them

        for (const spawn of spawns) {
            // Iterate if the spawn isn't spawning

            if (!spawn.spawning) continue

            // Get the spawning creep, iterating if it's undefined

            const creep = Game.creeps[spawn.spawning.name]
            if (!creep) continue

            // Otherwise display the role of the creep being spawn

            this.visual.text(creep.role, spawn.pos, {
                backgroundColor: 'rgb(255, 0, 0, 0)',
                font: 0.5,
                opacity: 1,
                color: myColors.lightBlue,
            })

            // And display how many ticks left until spawned

            this.visual.text((spawn.spawning.remainingTime - 1).toString(), spawn.pos.x, spawn.pos.y - 1, {
                backgroundColor: 'rgb(255, 0, 0, 0)',
                font: 0.5,
                opacity: 1,
                color: myColors.lightBlue,
            })
        }
    })()
    ;(() => {
        // If there is not a cSiteTargetID, stop

        if (!this.memory.cSiteTargetID) return

        // Convert the construction target ID into a game object

        const constructionTarget = findObjectWithID(this.memory.cSiteTargetID)

        // If the constructionTarget exists, show visuals for it

        if (constructionTarget) this.visual.text('🚧', constructionTarget.pos)
    })()
    ;(() => {
        if (!Memory.baseVisuals) return

        if (!this.memory.planned) return

        for (const stampType in stamps) {
            const stamp = stamps[stampType as StampTypes]

            for (const packedStampAnchor of this.memory.stampAnchors[stampType as StampTypes]) {
                const stampAnchor = unpackAsPos(packedStampAnchor)

                for (const structureType in stamp.structures) {
                    if (structureType === 'empty') continue

                    for (const pos of stamp.structures[structureType]) {
                        // Re-assign the pos's x and y to align with the offset

                        const x = pos.x + stampAnchor.x - stamp.offset
                        const y = pos.y + stampAnchor.y - stamp.offset

                        this.visual.structure(x, y, structureType as StructureConstant, {
                            opacity: structureType === STRUCTURE_ROAD ? 0.1 : 0.3,
                        })
                    }
                }
            }
        }

        this.visual.connectRoads()
    })()

    // If CPU logging is enabled, log the CPU used by this manager

    if (Memory.cpuLogging)
        customLog(
            'Room Visuals Manager',
            (Game.cpu.getUsed() - managerCPUStart).toFixed(2),
            undefined,
            myColors.lightGrey,
        )
}
