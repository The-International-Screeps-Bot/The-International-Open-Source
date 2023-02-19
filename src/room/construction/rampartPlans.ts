import { packXYAsNum } from 'international/utils'
import { packCoord, packRampartPlanCoord, packXYAsCoord } from 'other/codec'
import { encode, decode } from 'base32768'
import { allStructureTypes } from 'international/constants'

export class RampartPlans {
    map: { [packedCoord: string]: RampartPlanCoord }

    constructor(map?: { [packedCoord: string]: RampartPlanCoord }) {
        this.map = map || {}
    }
    set(packedCoord: string, minRCL: number, coversStructure: number, buildForNuke: number, buildForThreat: number) {
        const planCoord = this.map[packedCoord]
        if (!planCoord) {
            this.map[packedCoord] = {
                minRCL,
                coversStructure,
                buildForNuke,
                buildForThreat,
            }
            return
        }

        // The structureTypes are the same

        planCoord.minRCL = Math.min(planCoord.minRCL, minRCL)
        return
    }
    setXY(x: number, y: number, minRCL: number, coversStructure: number, buildForNuke: number, buildForThreat: number) {
        return this.set(packXYAsCoord(x, y), minRCL, coversStructure, buildForNuke, buildForThreat)
    }
    get(packedCoord: string) {
        return this.map[packedCoord]
    }
    getXY(x: number, y: number) {
        return this.get(packXYAsCoord(x, y))
    }
    pack() {
        let str = ''

        for (const packedCoord in this.map) {
            str += packedCoord + packRampartPlanCoord(this.map[packedCoord])
        }

        return str
    }
    static unpack(packedMap: string) {
        const plans = new RampartPlans()

        for (let i = 0; i < packedMap.length; i += 6) {
            const data = decode(packedMap[i + 2] + packedMap[i + 3] + packedMap[i + 4] + packedMap[i + 5])
            plans.map[packedMap[i] + packedMap[i + 1]] = {
                minRCL: data[0],
                coversStructure: data[1],
                buildForNuke: data[2],
                buildForThreat: data[3],
            }
        }

        return plans
    }
}
