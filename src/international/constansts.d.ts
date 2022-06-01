interface Constants {
    /**
     * The username of the account the bot is running for
     */
    me: string

    /**
     * The names of the shards for the mmo server
     */
    mmoShardNames: Set<string>

    /**
     * An array of usernames of players to avoid trading with
     */
    tradeBlacklist: Set<string>

    /**
     * A set of properties that are relative to a room's type
     */
    roomTypeProperties: { [key: string]: boolean }

    /**
     * A set of roomTypes with the properties they should be assigned
     */
    roomTypes: { [key: string]: { [key: string]: boolean } }

    /**
     * an array of strings of names of roles
     */
    creepRoles: CreepRoles[]

    /**
     * An array of messages of what to sign comunes with
     */
    communeSigns: string[]

    /**
     * An array of strings of messages of what to sign non-communes with
     */
    nonCommuneSigns: string[]

    /**
     * The hulistic dimensions of rooms
     */
    roomDimensions: number

    /**
     * An object with colour names as keys and hex codes as properties
     */
    colors: Colors

    /**
     * An array of all the structureTypes in the game
     */
    allStructureTypes: StructureConstant[]

    /**
     * An array of structureTypes that cannot be walked over
     */
    impassibleStructureTypes: StructureConstant[]

    /**
     * an array of structureTypes ordered by build priority
     */
    structureTypesByBuildPriority: BuildableStructureConstant[]

    structureTypesByNumber: { [key: string]: number }

    numbersByStructureTypes: {
        [key: string]: BuildableStructureConstant | 'empty'
    }

    styleForStructureTypes: { [key: string]: CircleStyle }
}
