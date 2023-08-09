import { randomIntRange } from "./utils"

/**
 * Persistent instances of this class and its inhereters are able to sleep
 */
export class SleepAble {
    /**
     * The tick we need to be asleep until
     */
    sleepUntil: number
    /**
     * How long we sleep for each time
     */
    sleepFor = randomIntRange(10, 20)

    /**
     * Simply checks if the program is alseep or not
     */
    isSleeping() {

        return this.sleepUntil > Game.time
    }

    /**
     * Begin sleeping next tick
     */
    sleepNextTick() {

        this.sleepUntil = Game.time + this.sleepFor
    }

    /**
     * Puts the program to sleep for future tick(s) if it is not
     */
    isSleepingResponsive() {

        if (this.sleepUntil > Game.time) return true

        this.sleepNextTick()
        return false
    }
}
