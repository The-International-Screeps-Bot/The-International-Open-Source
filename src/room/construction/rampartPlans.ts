import { packXYAsNum } from 'international/utils'
import { packCoord, packRampartPlanCoord, packXYAsCoord } from 'other/codec'
import { encode, decode } from 'base32768'
import { allStructureTypes } from 'international/constants'

export class RampartPlans {
    map: { [packedCoord: string]: RampartPlanCoord }

    constructor(map?: { [packedCoord: string]: RampartPlanCoord }) {
        this.map = map || {}
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

        for (let i = 0; i < packedMap.length; i += 5) {
            const data = decode(packedMap[i + 2] + packedMap[i + 3] + packedMap[i + 4])

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
