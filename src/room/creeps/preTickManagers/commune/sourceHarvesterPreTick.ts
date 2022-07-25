import { SourceHarvester } from "room/creeps/creepClasses"

SourceHarvester.prototype.preTickManager = function () {

    const { room } = this

    if (this.memory.SI) room.creepsOfSourceAmount[this.memory.SI] += 1
}
