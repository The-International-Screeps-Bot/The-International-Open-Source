import { CommuneStats } from "international/statsManager"

export interface StatsMemory {
    lastReset: number

    lastTickTimestamp: number
    lastTick: number
    tickLength: number

    communeCount: number

    resources: {
        pixels: number
        cpuUnlocks: number
        accessKeys: number
        credits: number
    }

    cpu: {
        bucket: number
        usage: number
        limit: number
    }

    memory: {
        /**
         * percentage of Memory used
         */
        usage: number
        limit: number
    }

    /**
     * Percentage of heap used
     */
    heapUsage: number
    gcl: {
        level: number
        progress: number
        progressTotal: number
    }

    gpl: {
        level: number
        progress: number
        progressTotal: number
    }
    rooms: { [roomName: string]: Partial<CommuneStats> }
    constructionSites: number
    creeps: number
    powerCreeps: number
}
