/* eslint class-methods-use-this: ["error", { "exceptMethods": ["MoveCreepsToTarget"] }] */
export default class GetShardVision {
     private _mainShard = 'shard2'
     private _shardNames = ['shard0', 'shard1', 'shard2', 'shard3']

     private _lastShardIndex = this._shardNames.indexOf(
          global.lastShardTarget ?? this._shardNames[this._shardNames.length - 1],
     )

     private SpawnCreeps() {
          const spawnShardFlag = Game.flags[this._shardNames[0]]
          if (!spawnShardFlag) return

          const spawns = Object.values(Game.spawns)
          let headSpawn: StructureSpawn = spawns[0]
          spawns.forEach((spawn): void => {
               if (spawnShardFlag.room === undefined) return

               const currentDistance = Game.map.getRoomLinearDistance(spawnShardFlag.room.name, spawn.room.name)
               const newDistance = Game.map.getRoomLinearDistance(spawnShardFlag.room.name, headSpawn.room.name)
               if (currentDistance < newDistance) headSpawn = spawn
          })
          if (!headSpawn) return

          const shardTarget =
               this._lastShardIndex === this._shardNames.length - 1
                    ? this._shardNames[0]
                    : this._shardNames[this._lastShardIndex + 1]

          const spawnResult = headSpawn.spawnCreep([MOVE], `${shardTarget}-${Game.time}`)
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
                    //           this.MoveCreepsToTarget(creep, Game.flags[this._mainShard].pos)
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
                         const orders = JSON.stringify(Game.market.getAllOrders())
                         if (!loggedOrders && Game.time % 100 === 0) {
                              console.log(orders)
                              loggedOrders = true
                         }
                         creep.say(creep.name)
                    }
               })
          })
     }
}
