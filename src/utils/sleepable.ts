import { randomIntRange } from './utils'

/**
 * Persistent instances of this class and its inhereters are able to sleep
 */
export class Sleepable {
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
   * Begin sleeping when whatever process being run is completed
   */
  sleepWhenDone() {
    this.sleepUntil = Game.time + this.sleepFor
  }

  /**
   * Puts the program to sleep for future tick(s) if it is not
   */
  isSleepingResponsive() {
    if (this.sleepUntil > Game.time) return true

    this.sleepWhenDone()
    return false
  }
}

/**
 * Persistent instances of this class and its inhereters are able to sleep
 */
export class StaticSleepable {
  /**
   * The tick we need to be asleep until
   */
  static sleepUntil: number
  /**
   * How long we sleep for each time
   */
  static sleepFor = randomIntRange(10, 20)

  /**
   * Simply checks if the program is alseep or not
   */
  static isSleeping() {
    return StaticSleepable.sleepUntil > Game.time
  }

  /**
   * Begin sleeping when whatever process being run is completed
   */
  static sleepWhenDone() {
    StaticSleepable.sleepUntil = Game.time + StaticSleepable.sleepFor
  }

  /**
   * Puts the program to sleep for future tick(s) if it is not
   */
  static isSleepingResponsive() {
    if (StaticSleepable.sleepUntil > Game.time) return true

    StaticSleepable.sleepWhenDone()
    return false
  }
}
