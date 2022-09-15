/* eslint class-methods-use-this: ["error", { "exceptMethods": ["MoveCreepsToTarget"] }] */
export default class GetShardVision {
    private _mainShard = 'shard0'
    private _shardNames = ['shard0', 'shard1', 'shard2', 'shard3']

    private _lastShardIndex = this._shardNames.indexOf(
        global.lastShardTarget ?? this._shardNames[this._shardNames.length - 1],
    )

    private SpawnCreeps() {
        const spawnShardFlag = Game.flags[this._shardNames[0]]
        if (!spawnShardFlag) return

        const roomNames = ['E72N6', 'E73N11', 'E73N13', 'E72N14', 'E69N12', 'E75N11']
        const spawns = Object.values(Game.spawns).filter(s => roomNames.includes(s.room.name))
        const spawn = spawns.filter(s => s.spawning === null)[0]
        if (!spawn) return

        const shardTarget =
            this._lastShardIndex === this._shardNames.length - 1
                ? this._shardNames[0]
                : this._shardNames[this._lastShardIndex + 1]

        const spawnResult = spawn.spawnCreep([MOVE], `${shardTarget}-${Game.time}`)
        if (spawnResult === OK || spawnResult === ERR_NAME_EXISTS) {
            global.lastShardTarget = shardTarget
        }
    }

    private MoveCreepsToTarget(creep: Creep, targetPos: RoomPosition) {
        if (!creep.pos.inRangeTo(targetPos, 0)) {
            creep.moveTo(targetPos)
        }
    }

    public Handle(): void {
        if (!this._shardNames.includes(Game.shard.name)) return

        this._shardNames.forEach((shardName, index): void => {
            if (Game.time % 100 === 0 && index === 0) {
                this.SpawnCreeps()
            }
            let loggedOrders = false

            const creeps = Object.values(Game.creeps).filter(c => c.name.includes(shardName))
            creeps.forEach(creep => {
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
                    this.MoveCreepsToTarget(creep, Game.flags[this._mainShard].pos)
                } else if (Game.shard.name === this._mainShard && shardName === 'shard1') {
                    this.MoveCreepsToTarget(creep, Game.flags.shard1.pos)
                } else if (shardName === 'shard2') {
                    if (Game.shard.name === this._mainShard) {
                        this.MoveCreepsToTarget(creep, Game.flags.shard1.pos)
                    } else if (Game.shard.name === 'shard1') {
                        this.MoveCreepsToTarget(creep, Game.flags.shard2.pos)
                    }
                } else if (shardName === 'shard3') {
                    if (Game.shard.name === this._mainShard) {
                        this.MoveCreepsToTarget(creep, Game.flags.shard1.pos)
                    } else if (Game.shard.name === 'shard1') {
                        this.MoveCreepsToTarget(creep, Game.flags.shard2.pos)
                    } else if (Game.shard.name === 'shard2') {
                        this.MoveCreepsToTarget(creep, Game.flags.shard3.pos)
                    }
                }

                if (Game.shard.name === shardName) {
                    if (!loggedOrders && Game.time % 100 === 0) {
                        console.log(JSON.stringify(Game.market.getAllOrders()))
                        if (Game.time % 1000 === 0) {
                            console.log(JSON.stringify(Game.market.getHistory()))
                        }
                        loggedOrders = true
                    }
                    creep.say(shardName)
                }
            })
        })
    }
}
