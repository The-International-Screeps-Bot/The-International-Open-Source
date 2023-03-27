import { mockGlobal, mockInstanceOf, mockStructure } from 'screeps-jest'
mockGlobal<Memory>('Memory', {})
mockGlobal<Game>('Game', {
    shard: { name: 'shard' },
})

import * as Codec from './codec'
import { BasePlans } from 'room/construction/basePlans'
import { allStructureTypes, buildableStructureTypes } from 'international/constants'

const roomName = 'W1N1'
describe('codec', () => {
    it('should encode and decode ids', () => {
        const ids = [
            '63f1374851b2398ffdc7ccee',
            '63f1384de9dbe683bb0ac33d',
            '63f142577691314e86adc93b',
            '63f14590ef781f3c287c92c4',
            '63f1460de9dbe657270ac7bb',
        ]

        for (const id of ids) {
            const encoded = Codec.packId(id)
            const decoded = Codec.unpackId(encoded)
            expect(decoded).toEqual(id)
        }

        const encodedList = Codec.packIdList(ids)
        const decodedList = Codec.unpackIdList(encodedList)
        expect(decodedList).toEqual(ids)
    })
    it('should encode and decode coords', () => {
        const coords = []
        for (let x = 1; x < 50; x++) {
            for (let y = 1; y < 50; y++) {
                coords.push({ x, y })
                const encodedCoord = Codec.packCoord({ x, y })
                const decodedCoord = Codec.unpackCoord(encodedCoord)
                expect(decodedCoord).toEqual({ x, y })

                const encodedXY = Codec.packXYAsCoord(x, y)
                const decodedXY = Codec.unpackCoord(encodedXY)
                expect(decodedXY).toEqual({ x, y })
            }
        }

        const encodedList = Codec.packCoordList(coords)
        const decodedList = Codec.unpackCoordList(encodedList)
        expect(decodedList).toEqual(coords)
        expect(decodedList.length).toEqual(49 * 49)
    })

    it('should encode and decode coords with a roomName', () => {
        const positions = []
        let encodedCoords: string = ''
        for (let x = 1; x < 50; x++) {
            for (let y = 1; y < 50; y++) {
                const pos = new RoomPosition(x, y, roomName)
                positions.push(pos)
                const encodedPos = Codec.packPos(pos)
                const decodedPos = Codec.unpackPos(encodedPos)
                expect({ x: decodedPos.x, y: decodedPos.y, roomName: decodedPos.roomName }).toEqual({
                    x: pos.x,
                    y: pos.y,
                    roomName: pos.roomName,
                })

                const encodedCoord = Codec.packCoord({ x, y })
                encodedCoords += encodedCoord
                const decodedCoordAsPos = Codec.unpackCoordAsPos(encodedCoord, roomName)
                expect({
                    x: decodedCoordAsPos.x,
                    y: decodedCoordAsPos.y,
                    roomName: decodedCoordAsPos.roomName,
                }).toEqual({
                    x,
                    y,
                    roomName,
                })
            }
        }

        const encodedList = Codec.packPosList(positions)
        const decodedList = Codec.unpackPosList(encodedList)
        for (let p = 0; p < positions.length; p++) {
            expect({ x: decodedList[p].x, y: decodedList[p].y, roomName: decodedList[p].roomName }).toEqual({
                x: positions[p].x,
                y: positions[p].y,
                roomName: positions[p].roomName,
            })
        }

        const decodedCoordAsPosList = Codec.unpackCoordListAsPosList(encodedCoords, roomName)
        for (let p = 0; p < positions.length; p++) {
            expect({
                x: decodedCoordAsPosList[p].x,
                y: decodedCoordAsPosList[p].y,
                roomName: decodedCoordAsPosList[p].roomName,
            }).toEqual({
                x: positions[p].x,
                y: positions[p].y,
                roomName: positions[p].roomName,
            })
        }
        expect(decodedList.length).toEqual(49 * 49)
    })

    it('should reverse position list', () => {
        const positions = []
        for (let x = 1; x < 50; x++) {
            for (let y = 1; y < 50; y++) {
                const pos = new RoomPosition(x, y, roomName)
                positions.push(pos)
            }
        }
        const encoded = Codec.packPosList(positions)
        const reversed2Times = Codec.reversePosList(Codec.reversePosList(encoded))
        expect(reversed2Times).toEqual(encoded)
        expect(reversed2Times.length).toEqual(49 * 49 * 3)
    })

    it('should encode and decode room names', () => {
        const roomNames = ['W1N1', 'W1S1', 'E1N1', 'E1S1']
        for (const roomName of roomNames) {
            const encoded = Codec.packRoomName(roomName)
            const decoded = Codec.unpackRoomName(encoded.quadrant, encoded.x, encoded.y)
            expect(decoded).toEqual(roomName)
        }

        expect(Codec.unpackRoomName(-1, 0, 0)).toEqual('ERROR')
    })

    it('should encode and decode plan coord', () => {
        for (let s = 1; s < 5; s++) {
            for (let r = 1; r < 10; r++) {
                const encoded = Codec.packBasePlanCoord([{ minRCL: r, structureType: buildableStructureTypes[s] }])
                const decoded = Codec.unpackBasePlanCoords(encoded)
                expect(decoded).toEqual({ minRCL: r, structureType: buildableStructureTypes[s] })
            }
        }
    })

    // it('should encode and decode base plans', () => {
    //     const basePlan: { [packedCoord: string]: BasePlanCoord } = {}

    //     for (let x = 1; x < 50; x++) {
    //         for (let y = 1; y < 50; y++) {
    //             const coord = { x, y }
    //             const packedCoord = Codec.packCoord(coord)
    //             basePlan[packedCoord] = { minRCL: 1, structureType: STRUCTURE_EXTENSION }
    //         }
    //     }

    //     const encoded = Codec.packBasePlans(basePlan)
    //     const decoded = BasePlans.unpackBasePlans(encoded)
    //     const values = Object.values(decoded.map)
    //     values.forEach(planCoord => {
    //         expect(planCoord).toEqual({ minRCL: 1, structureType: STRUCTURE_EXTENSION })
    //     })
    //     expect(values.length).toEqual(49 * 49)
    // })
})
