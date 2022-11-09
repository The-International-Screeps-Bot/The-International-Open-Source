export enum AllyRequestTypes {
    resource,
    defense,
    attack,
    execute,
    hate,
    build
}

interface AllyRequest {
    requestType: AllyRequestTypes
    roomName?: string
    playerName?: string
    resourceType?: ResourceConstant
    maxAmount?: number
    /**
     * A number representing the need of the request, where 1 is highest and 0 is lowest
     */
    priority: number
    minDamage?: number
    minHeal?: number
    hateAmount?: number
}


/**
 * Contains functions and methods useful for ally trading. Ensure allyTrading in Memory is enabled, as well as no other values or in the designated simpleAlliesSegment before usage
 */
class AllyManager {
    /**
     * An array of the requests you have made this tick
     */
    myRequests: AllyRequest[]

    /**
     * An array of all the current requests made by other allies
     */
    allyRequests: AllyRequest[]

    constructor() {}
    /**
     * Gets allyRequests, sets up requirements to use the foreign segment
     */
    getAllyRequests() {
        if (!Memory.allyTrading) return

        const allyArray = Array.from(Memory.allyPlayers)
        if (!allyArray.length) return

        // Run every so often, increasing based on ally count

        if (Game.time % (10 + allyArray.length) >= allyArray.length) return

        const currentAllyName = allyArray[Game.time % allyArray.length]

        //

        if (RawMemory.foreignSegment && RawMemory.foreignSegment.username === currentAllyName) {
            try {
                // Get the allyRequests and record them in the allyManager
                this.allyRequests = JSON.parse(RawMemory.foreignSegment.data)
            } catch (err) {}
        }

        const nextAllyName = allyArray[(Game.time + 1) % allyArray.length]
        RawMemory.setActiveForeignSegment(nextAllyName, Memory.simpleAlliesSegment)
    }
    /**
     * To call before any requests are made. Configures some required values
     */
    tickConfig() {
        // Initialize myRequests and allyRequests

        this.myRequests = []
        this.allyRequests = []
    }
    /**
     * To call after requests have been made, to assign requests to the next ally
     */
    endTickManager() {
        if (!Memory.allyTrading) return

        if (Object.keys(RawMemory.segments).length < 10) {
            // Assign myRequests to the public segment
            RawMemory.segments[Memory.simpleAlliesSegment] = JSON.stringify(this.myRequests || [])
            RawMemory.setPublicSegments([Memory.simpleAlliesSegment])
        }
    }
    /**
     * Request an attack of a specified room
     */
    requestAttack(
        roomName: string,
        playerName: string,
        minDamage: number = 0,
        minHeal: number = 0,
        priority: number = 0,
    ) {
        this.myRequests.push({
            requestType: AllyRequestTypes.attack,
            roomName,
            playerName,
            minDamage,
            minHeal,
            priority,
        })
    }
    /**
     * Request help for a specified room
     */
    requestDefense(roomName: string, minDamage: number = 0, minHeal: number = 0, priority: number = 0) {
        this.myRequests.push({
            requestType: AllyRequestTypes.defense,
            roomName,
            minDamage,
            minHeal,
            priority,
        })
    }
    /**
     * Request hate for a specified room. It's up to you and your allies how to intepret hate
     */
    requestHate(playerName: string, hateAmount: number, priority: number = 0) {
        this.myRequests.push({
            requestType: AllyRequestTypes.hate,
            playerName,
            priority,
        })
    }

    /**
     * Request resources for a specified room. Handled by the tradeManager
     */
    requestResource(roomName: string, resourceType: ResourceConstant, maxAmount: number, priority: number = 0) {
        this.myRequests.push({
            requestType: AllyRequestTypes.resource,
            resourceType,
            maxAmount,
            roomName,
            priority,
        })
    }

    /**
     * Request resources for a specified room. Handled by the tradeManager
     */
     requestBuild(roomName: string, priority: number = 0) {
        this.myRequests.push({
            requestType: AllyRequestTypes.build,
            roomName,
            priority,
        })
    }
}

export const allyManager = new AllyManager()
