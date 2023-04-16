/* eslint class-methods-use-this: ["error", { "exceptMethods": ["MoveCreepsToTarget"] }] */

import { customLog } from 'international/utils'

function isMemorySetup(memory: ShardVisionMemory, mainShard: string): boolean {
    if (Game.shard.name === mainShard) return memory.shards !== undefined && memory.lastSeen !== undefined
    return memory.lastSeen !== undefined
}

function loadShardVisionMemory(shardNames: string[], shardId: string): ShardVisionMemory {
    let segment = JSON.parse(InterShardMemory.getRemote(shardId) || '{}')
    const defaultObject: ShardVisionMemory = { lastSeen: 0 }
    if (!isMemorySetup(segment.shardVision || {}, shardNames.length > 0 ? shardNames[0] : shardId)) {
        if (Game.shard.name === shardNames[0]) {
            defaultObject.shards = {}
            for (let i = 0; i < shardNames.length; i++) {
                const shardName = shardNames[i]
                defaultObject.shards[shardName] = 0
            }
        }
        segment.shardVision = defaultObject
    }
    return segment.shardVision
}

function saveShardVisionMemory(shardVision: ShardVisionMemory) {
    let segment = JSON.parse(InterShardMemory.getLocal() || '{}')
    segment.shardVision = shardVision
    InterShardMemory.setLocal(JSON.stringify(segment))
}

const secondsAddition = 1000 * 60 * 60

class HandleSpawning {
    private _shardNames: string[]
    private _shardVisionMemory: ShardVisionMemory
    constructor(shardNames: string[]) {
        this._shardNames = shardNames
        this._shardVisionMemory = loadShardVisionMemory(shardNames, this._shardNames[0])
    }

    private spawnCreep(shardTarget: string) {
        const spawnShardFlag = Game.flags[this._shardNames[0]]
        if (!spawnShardFlag) return false

        const roomNames = ['E72N14', 'E74N7', 'E69N17, E68N17', 'E71N18', 'E69N19']
        const spawn = Object.values(Game.spawns).find(s => roomNames.includes(s.room.name) && s.spawning === null)
        if (!spawn) return false

        const spawnResult = spawn.spawnCreep([MOVE], `${shardTarget}-${Game.time}`)
        return spawnResult === OK
    }

    public spawnCreepIfNeeded() {
        this._shardVisionMemory.lastSeen = Date.now() + secondsAddition

        for (let i = 0; i < this._shardNames.length; i++) {
            const shardName = this._shardNames[i]
            const shardMemory = loadShardVisionMemory(this._shardNames, shardName)
            if (Math.max(this._shardVisionMemory.shards[shardName], shardMemory.lastSeen) < Date.now()) {
                const spawnResult = this.spawnCreep(shardName)
                if (spawnResult) {
                    this._shardVisionMemory.shards[shardName] = Date.now() + secondsAddition
                    saveShardVisionMemory(this._shardVisionMemory)
                    return true
                }
            }
        }
        return false
    }

    public static saveLastSeen(shardName: string) {
        const shardMemory = loadShardVisionMemory([], shardName)
        shardMemory.lastSeen = Date.now() + secondsAddition
        saveShardVisionMemory(shardMemory)
    }
}

export default class GetShardVision {
    private _mainShard = 'shard0'
    private _shardNames = ['shard0', 'shard1', 'shard2', 'shard3']

    private moveCreepsToTarget(creep: Creep, targetPos: RoomPosition) {
        if (!creep.pos.inRangeTo(targetPos, 0)) {
            creep.moveTo(targetPos)
        }
    }

    private isMyShard(shardName: string) {
        return Game.shard.name === shardName
    }

    public Handle(): void {
        if (!this._shardNames.includes(Game.shard.name)) return

        const roomNames: { [roomName: string]: string[] } = {}
        this._shardNames.forEach((shardName, index): void => {
            if (index === 0) {
                const handleSpawning = new HandleSpawning(this._shardNames)
                if (handleSpawning.spawnCreepIfNeeded()) {
                    customLog(`Spawning ShardVision Creep for ${shardName}!`, shardName)
                }
            }
            let loggedOrders = false

            if (this.isMyShard(shardName) && this._shardNames[0] !== shardName) HandleSpawning.saveLastSeen(shardName)

            const creeps = Object.values(Game.creeps).filter(c => c.name.includes(shardName))
            creeps.forEach(creep => {
                Game.map.visual.text(shardName, creep.pos, { backgroundColor: '#000000', opacity: 1, fontSize: 4 })
                if (!roomNames[creep.room.name]) roomNames[creep.room.name] = [shardName]
                else if (!roomNames[creep.room.name].includes(shardName)) roomNames[creep.room.name].push(shardName)
                // * If main shard isn't shard3 or shard0
                // * Ask PandaMaster to modify this code!
                // if (Game.shard.name === this._mainShard && shardName === this._mainShard) {
                //      this.MoveCreepsToTarget(creep, Game.flags[this._mainShard].pos)
                // } else if (Game.shard.name === this._mainShard && shardName === 'shard3') {
                //      this.MoveCreepsToTarget(creep, Game.flags.shard3.pos)
                // } else if (shardName === 'shard1') {
                //      if (Game.shard.name === this._mainShard) {
                //           this.MoveCreepsToTarget(creep, Game.flags.shard1.pos)
                //      }
                // } else if (shardName === 'shard0') {
                //      if (Game.shard.name === this._mainShard) {
                //           this.MoveCreepsToTarget(creep, Game.flags.shard1.pos)
                //      } else if (Game.shard.name === 'shard1') {
                //           this.MoveCreepsToTarget(creep, Game.flags.shard0.pos)
                //      }
                // }

                // * If main shard is shard3 or shard0
                // * Ask PandaMaster to modify this code!
                if (Game.shard.name === this._mainShard && shardName === this._mainShard) {
                    this.moveCreepsToTarget(creep, Game.flags[this._mainShard].pos)
                } else if (Game.shard.name === this._mainShard && shardName === 'shard1') {
                    this.moveCreepsToTarget(creep, Game.flags.shard1.pos)
                } else if (shardName === 'shard2') {
                    if (Game.shard.name === this._mainShard) {
                        this.moveCreepsToTarget(creep, Game.flags.shard1.pos)
                    } else if (Game.shard.name === 'shard1') {
                        this.moveCreepsToTarget(creep, Game.flags.shard2.pos)
                    }
                } else if (shardName === 'shard3') {
                    if (Game.shard.name === this._mainShard) {
                        this.moveCreepsToTarget(creep, Game.flags.shard1.pos)
                    } else if (Game.shard.name === 'shard1') {
                        this.moveCreepsToTarget(creep, Game.flags.shard2.pos)
                    } else if (Game.shard.name === 'shard2') {
                        this.moveCreepsToTarget(creep, Game.flags.shard3.pos)
                    }
                }

                if (this.isMyShard(shardName)) {
                    if (!loggedOrders && Game.time % 100 === 0) {
                        console.log(JSON.stringify(Game.market.getAllOrders()))
                        if (Game.time % 1000 === 0) {
                            console.log(JSON.stringify(Game.market.getHistory()))
                        }
                        loggedOrders = true
                    }
                }
                creep.say(shardName)
            })
        })

        Object.entries(roomNames).forEach(([roomName, shardNames]) => {
            Game.map.visual.rect(new RoomPosition(1, 1, roomName), 48, 48)
            Game.map.visual.text(shardNames.join('\r\n'), new RoomPosition(10, 10, roomName), {
                fontSize: 6,
                backgroundColor: '#000000',
                opacity: 1,
            })
        })
    }
}
