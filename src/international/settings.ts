export interface Settings {
    /**
     * The current breaking version of the bot
     * Increment by 1 when a change has been made that will break previous versions of the bot
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
    allyPlayers: string[]

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
     * Wether the bot should automatically respond to claimRequests
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
     * The public segment number (0-100) that you and your allies are using
     */
    simpleAlliesSegment: number
    /**
     * Wether or not to send errors, if set up, to the error storer
     */
    errorExporting: boolean
}

export const settings: Settings = {
    breakingVersion: 94,

    // Default values, do not change. Instead modify clones in memory

    roomVisuals: false,
    baseVisuals: false,
    dataVisuals: false,
    mapVisuals: false,
    CPULogging: false,
    roomStats: 2,
    allyPlayers: [
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
    tradeBlacklist: [''],
    pixelSelling: false,
    pixelGeneration: false,
    autoClaim: true,
    autoAttack: false,
    publicRamparts: false,
    allyTrading: true,
    marketUsage: true,
    logging: false,
    creepSay: true,
    simpleAlliesSegment: 90,
    errorExporting: true,
}
