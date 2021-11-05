import { creepClasses } from "../creepClasses"
const SourceHarvester = creepClasses.sourceHarvester

SourceHarvester.prototype.sayHi = function() {

    const creep = this

    creep.say('hi')
}
