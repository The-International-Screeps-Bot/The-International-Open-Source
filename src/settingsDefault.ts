export interface Settings {
    /**
     * The current breaking version of the bot.
     * Increment to induce migrations which can be controlled with the migration manager
     */
    breakingVersion: number | undefined
    /**
     * Wether the bot should generate any room visuals
     */
    roomVisuals: boolean

    /**
     * Wether the bot should generate base room visuals
     */
    baseVisuals: boolean

    /**
     * Wether or not to generate data visuals
     */
    dataVisuals: boolean

    /**
     * Wether the bot should generate map visuals
     */
    mapVisuals: boolean

    /**
     * A list of usernames to treat as allies
     */
    allies: string[]

    /**
     * A list of usernames to treat as neutral
     */
    nonAggressionPlayers: string[]

    /**
     * A list of usernames to not trade with
     */
    tradeBlacklist: string[]

    /**
     * Wether the bot should sell pixels
     */
    pixelSelling: boolean

    /**
     * Wether the bot should generate pixels
     */
    pixelGeneration: boolean

    /**
     * Wether the bot should automatically respond to workRequests
     */
    autoClaim: boolean

    /**
     * Wether or not to automatically create attack requests for viable targets
     */
    autoAttack: boolean

    /**
     * Wether the bot should enable ramparts when there is no enemy present
     */
    publicRamparts: boolean

    /**
     * Wether the bot should try trading with its allies
     */
    allyCommunication: boolean

    /**
     * Wether or not the bot should be using the market
     */
    marketUsage: boolean

    /**
     * The number of ticks to publish customLogs for. 0 disabled logging. Cannot be more than 100
     */
    logging: number

    /**
     * Wether or not creeps should use .say
     */
    creepSay: boolean

    /**
     * Wether or not creeps should chant slogans
     */
    creepChant: boolean

    /**
     * The public segment number (0-99) that you and your allies are using
     */
    allySegmentID: number
    /**
     * Wether or not to send errors, if set up, to the error storer
     */
    errorExporting: boolean
    /**
     * Wether or not to try to migrate existing structures to planned positions
     */
    structureMigration: boolean
    /**
     * Wether or not to generate visuals for room logistics requests
     */
    roomLogisticsVisuals: boolean
    /**
     * Wether or not to generate and display logs for debugging purposes
     */
    debugLogging: boolean
}

/**
 * Default global.settings. DO NOT MODIFY. Instead, include your preferences in global.settings.ts
 */
export const defaultSettings: Settings = {
    breakingVersion: 113,
    roomVisuals: false,
    baseVisuals: false,
    dataVisuals: false,
    mapVisuals: false,
    allies: [
        'MarvinTMB'
    ],
    nonAggressionPlayers: [],
    tradeBlacklist: [],
    pixelSelling: false,
    pixelGeneration: false,
    autoClaim: true,
    autoAttack: false,
    publicRamparts: false,
    allyCommunication: true,
    marketUsage: true,
    logging: Game.shard.name === 'performanceServer' ? 0 : 1,
    creepSay: true,
    creepChant: true,
    allySegmentID: 90,
    errorExporting: true,
    structureMigration: true,
    roomLogisticsVisuals: false,
    debugLogging: false,
}
