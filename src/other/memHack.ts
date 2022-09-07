/**
 * Ripped from https://github.com/AlinaNova21/ZeSwarm/
 * Organized by Carson Burke and xTwisteDx
 *
 * Usage:
 * Before the loop, import memHack
 * At start of loop(), run memHack.run()
 */
class MemHack {
     memory: Memory | undefined

     constructor() {
          this.memory = Memory
          this.memory = RawMemory._parsed
     }

     run() {
          delete global.Memory
          global.Memory = this.memory
          RawMemory._parsed = this.memory
     }
}

export const memHack = new MemHack()
