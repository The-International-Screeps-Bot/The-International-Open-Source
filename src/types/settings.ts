export interface Settings {
  /**
   * The current breaking version of the bot.
   * Increment to induce migrations which can be controlled with the migration manager
   */
  breakingVersion: number | undefined

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
   * The number of ticks to publish LogOpss for. 0 disabled logging. Cannot be more than 100
   */
  logging: number

  /**
   * Wether or not creeps should use .say
   */
  creepSay: boolean

  /**
   * Wether or not creeps should chant slogans
   */
  creepChant: string[]

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
   * Wether or not to generate and display logs for debugging purposes
   */
  debugLogging: boolean
  /**
   * Wether or not the bot should run season logic
   */
  season: boolean
  /* relationships: RelationshipSettings */
}

/* type RelationshipSettings = {[playerName: string]: PlayerRelationships} */
