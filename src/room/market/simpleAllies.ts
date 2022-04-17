import { allyList } from "international/constants"

type PrependNextNum<A extends Array<unknown>> = A['length'] extends infer T ? ((t: T, ...a: A) => void) extends ((...x: infer X) => void) ? X : never : never

type EnumerateInternal<A extends Array<unknown>, N extends number> = { 0: A, 1: EnumerateInternal<PrependNextNum<A>, N> }[N extends A['length'] ? 0 : 1]

export type Enumerate<N extends number> = EnumerateInternal<[], N> extends (infer E)[] ? E : never

export type Range<FROM extends number, TO extends number> = Exclude<Enumerate<TO>, Enumerate<FROM>>

type RequestEnums = Range<0, 5>

interface RequestTypes {
    RESOURCE: 0
    DEFENSE: 1
    ATTACK: 2
    EXECUTE: 3
    HATE: 4
}

interface Request {
    requestType: RequestEnums
    roomName?: string
    playerName?: string
    resourceType?: ResourceConstant
    maxAmount?: number
    /**
     * A number representing the need of the request, where 1 is highest and 0 is lowest
     */
    priority: number
}

const segmentID = 90,
allyArray = [...allyList]

class AllyManager {

    myRequests: Request[]
    allyRequests: Request[]

    /**
     * An enumerator with keys of requestType names and values of number references
     */
    requestTypes: RequestTypes

    /**
     * Gets allyRequests
     */
    getAllyRequests?(): void

    /**
     * To call before any requests are made
     */
    tickConfig?(): void

    /**
     * To call after requests have been made
     */
    endTickManager?(): void

    /**
     * Request an attack of a specified room
     */
    requestAttack?(roomName: string, playerName: string, priority?: number): void

    /**
     * Request help for a specified room
     */
    requestHelp?(roomName: string, priority?: number): void

    /**
     * Request hate for a specified room
     */
    requestHate?(playerName: string, priority?: number): void

    /**
     * Request resources for a specified room
     */
    requestResource?(roomName: string, resourceType: ResourceConstant, maxAmount: number, priority?: number): void

    constructor() {

        const allyManager = this

        allyManager.myRequests = []

        allyManager.requestTypes = {
            RESOURCE: 0,
            DEFENSE: 1,
            ATTACK: 2,
            EXECUTE: 3,
            HATE: 4
        }
    }
}

// This sets foreign segments. Maybe you set them yourself for some other reason
// Up to you to fix that.

AllyManager.prototype.getAllyRequests = function() {

    const allyManager = this

    // Stop if there are no allies

    if (!allyArray.length) return

    // Run only once every 10 ticks

    if (Game.time % (10 * allyArray.length) >= allyArray.length) return

    const currentAllyName = allyArray[Game.time % allyArray.length]

    //

    if (RawMemory.foreignSegment && RawMemory.foreignSegment.username == currentAllyName) {

        try {

            // Get the allyRequests and record them in the allyManager

            allyManager.allyRequests = JSON.parse(RawMemory.foreignSegment.data)

        } catch (err) {}
    }

    const nextAllyName = allyArray[(Game.time + 1) % allyArray.length]
    RawMemory.setActiveForeignSegment(nextAllyName, segmentID)
}

AllyManager.prototype.tickConfig = function() {

    const allyManager = this

    // Reset myRequests

    allyManager.myRequests = []
}

AllyManager.prototype.endTickManager = function() {

    const allyManager = this

    if (Object.keys(RawMemory.segments).length < 10) {

        // Assign myRequests to the public segment

        RawMemory.segments[segmentID] = JSON.stringify(allyManager.myRequests)

        RawMemory.setPublicSegments([segmentID])
    }
}

AllyManager.prototype.requestAttack = function(roomName, playerName, priority = 0) {

    const allyManager = this

    allyManager.myRequests.push({
        requestType: allyManager.requestTypes.ATTACK,
        roomName,
        playerName,
        priority
    })
}

AllyManager.prototype.requestHelp = function(roomName, priority = 0) {

    const allyManager = this

    allyManager.myRequests.push({
        requestType: allyManager.requestTypes.DEFENSE,
        roomName,
        priority
    })
}

AllyManager.prototype.requestHate = function(playerName, priority = 0) {

    const allyManager = this

    allyManager.myRequests.push({
        requestType: allyManager.requestTypes.HATE,
        playerName,
        priority
    })
}

AllyManager.prototype.requestResource = function(roomName, resourceType, maxAmount, priority = 0) {

    const allyManager = this

    allyManager.myRequests.push({
        requestType: allyManager.requestTypes.RESOURCE,
        resourceType,
        maxAmount,
        roomName,
        priority
    })
}

export const allyManager = new AllyManager()
