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
     * Wether the bot should log CPU data
     */
    CPULogging: boolean

    /**
     * Wether the bot save RoomStats data
     */
    roomStats: 0 | 1 | 2

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
    allyTrading: boolean

    /**
     * Wether or not the bot should be using the market
     */
    marketUsage: boolean

    /**
     * Wether or not the bot should be using customLog
     */
    logging: boolean

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
    simpleAlliesSegment: number
    /**
     * Wether or not to send errors, if set up, to the error storer
     */
    errorExporting: boolean
    /**
     * Wether or not to try to migrate existing structures to planned positions
     */
    structureMigration: boolean
}

/**
 * Default global.settings. DO NOT MODIFY. Instead, include your preferences in global.settings.ts
 */
export const defaultSettings: Settings = {
    breakingVersion: 109,
    roomVisuals: false,
    baseVisuals: false,
    dataVisuals: false,
    mapVisuals: false,
    CPULogging: Game.shard.name === 'performanceServer' ? true : false,
    roomStats: 2,
    allies: [
        'MarvinTMB',
        'PandaMaster',
        'lokenwow',
        'LittleBitBlue',
        'DefaultO',
        'Allorrian',
        'Aerics',
        'PlaidRabbit',
        'SokarNox',
        'Amberdark',
    ],
    nonAggressionPlayers: ['Q13214', 'HerrKai', 'Raggy', 'somygame', 'shley92822212'],
    tradeBlacklist: [],
    pixelSelling: false,
    pixelGeneration: false,
    autoClaim: true,
    autoAttack: false,
    publicRamparts: false,
    allyTrading: true,
    marketUsage: true,
    logging:
        Game.shard.name !== 'performanceServer'
            ? Object.keys(Game.spawns).length > 0 || Game.shard.name.search('shard[0-3]') === -1
            : false,
    creepSay: true,
    creepChant: true,
    simpleAlliesSegment: 90,
    errorExporting: false,
    structureMigration: true,
}
