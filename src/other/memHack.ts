/**
 * Ripped from https://github.com/AlinaNova21/ZeSwarm/
 * only slightly modified and adjusted for Typescript
 * Modified by Carson Burke
 *
 * Usage:
 * At top of main: import memHack
 * At top of loop() in main, memHack.modifyMemory()
 */
class MemHack {
    memory: Memory | undefined

    parseTime: number

    constructor() {
        this.memory = undefined
        this.parseTime = -1
    }

    init() {
        const cpu = Game.cpu.getUsed()

        this.memory = Memory

        Game.cpu.getUsed() - cpu

        this.memory = RawMemory._parsed
    }

    modifyMemory() {
        delete global.Memory

        global.Memory = this.memory

        RawMemory._parsed = this.memory
    }
}

export const memHack = new MemHack()

memHack.init()
