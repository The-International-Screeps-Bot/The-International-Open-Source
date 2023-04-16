// eslint-disable
import { allStructureTypes, buildableStructureTypes, packedPosLength, stampKeys } from 'international/constants'
import { encode, decode } from 'base32768'

/**
 * Convert a standard 24-character hex id in screeps to a compressed UTF-16 encoded string of length 6.
 *
 * Benchmarking: average of 500ns to execute on shard2 public server, reduce stringified size by 75%
 */
export function packId(id: string) {
    return (
        String.fromCharCode(parseInt(id.substr(0, 4), 16)) +
        String.fromCharCode(parseInt(id.substr(4, 4), 16)) +
        String.fromCharCode(parseInt(id.substr(8, 4), 16)) +
        String.fromCharCode(parseInt(id.substr(12, 4), 16)) +
        String.fromCharCode(parseInt(id.substr(16, 4), 16)) +
        String.fromCharCode(parseInt(id.substr(20, 4), 16))
    )
}

/**
 * Convert a compressed six-character UTF-encoded id back into the original 24-character format.
 *
 * Benchmarking: average of 1.3us to execute on shard2 public server
 */
export function unpackId(packedId: string) {
    let id = ''
    let current: number
    for (let i = 0; i < 6; ++i) {
        current = packedId.charCodeAt(i)
        id += (current >>> 8).toString(16).padStart(2, '0') // String.padStart() requires es2017+ target
        id += (current & 0xff).toString(16).padStart(2, '0')
    }
    return id
}

/**
 * Packs a list of ids as a utf-16 string. This is better than having a list of packed coords, as it avoids
 * extra commas and "" when memory gets stringified.
 *
 * Benchmarking: average of 500ns per id to execute on shard2 public server, reduce stringified size by 81%
 */
export function packIdList(ids: string[]) {
    let str = ''
    for (let i = 0; i < ids.length; ++i) {
        str += packId(ids[i])
    }
    return str
}

/**
 * Unpacks a list of ids stored as a utf-16 string.
 *
 * Benchmarking: average of 1.2us per id to execute on shard2 public server.
 */
export function unpackIdList(packedIds: string) {
    const ids: string[] = []
    for (let i = 0; i < packedIds.length; i += 6) {
        ids.push(unpackId(packedIds.substr(i, 6)))
    }
    return ids
}

/**
 * Packs a coord as two UInt8 characters.
 */
export function packCoord(coord: Coord) {
    return encode(new Uint8Array([coord.x, coord.y]))
}

/**
 * Packs a coord as two Base32768 characters
 */
export function packXYAsCoord(x: number, y: number) {
    return encode(new Uint8Array([x, y]))
}

/**
 * Unpacks a coord stored as two Uint8 characters
 *
 * Benchmarking: average of 60ns-100ns to execute on shard2 public server
 */
export function unpackCoord(char: string) {
    const decoded = decode(char)
    return { x: decoded[0], y: decoded[1] }
}

/**
 * Unpacks a coordinate and creates a RoomPosition object from a specified roomName
 */
export function unpackCoordAsPos(packedCoord: string, roomName: string) {
    const coord = unpackCoord(packedCoord)
    return new RoomPosition(coord.x, coord.y, roomName)
}

/**
 * Reverse the encoded coordList
 */
export function reversePosList(coordList: string) {

    return coordList
        .match(/.{1,3}/g)
        .reverse()
        .join('')
}

/**
 * Packs a list of coords as a Base32768 string. This is better than having a list of packed coords, as it avoids
 * extra commas and "" when memory gets stringified.
 */
export function packCoordList(coords: Coord[]) {
    let str = ''
    const maxLength = coords.length
    for (let i = 0; i < maxLength; i++) {
        str += packCoord(coords[i])
    }
    return str
}

/**
 * Unpacks a list of coords stored as a Base32768 string
 *
 * Benchmarking: average of 100ns per coord to execute on shard2 public server
 */
export function unpackCoordList(chars: string) {
    const coords: Coord[] = []
    for (let i = 0; i < chars.length; i += 2) {
        coords.push(unpackCoord(chars[i] + chars[i + 1]))
    }
    return coords
}

/**
 * Unpacks a list of coordinates and creates a list of RoomPositions from a specified roomName
 */
export function unpackCoordListAsPosList(packedCoords: string, roomName: string) {
    const positions: RoomPosition[] = []
    let coord: Coord
    for (let i = 0; i < packedCoords.length; i += 2) {
        coord = unpackCoord(packedCoords[i] + packedCoords[i + 1])
        positions.push(new RoomPosition(coord.x, coord.y, roomName))
    }
    return positions
}

/**
 * Packs a roomName as Base32768 string.
 */
export function packRoomName(roomName: string) {
    const coordinateRegex = /(E|W)(\d+)(N|S)(\d+)/g
    const match = coordinateRegex.exec(roomName)!

    const xDir = match[1]
    const x = Number(match[2])
    const yDir = match[3]
    const y = Number(match[4])

    let quadrant
    if (xDir === 'W') {
        if (yDir === 'N') {
            quadrant = 0
        } else {
            quadrant = 1
        }
    } else if (yDir === 'N') {
        quadrant = 2
    } else {
        quadrant = 3
    }

    return { quadrant, x, y }
}

/**
 * Unpack room name
 */
export function unpackRoomName(q: number, x: number, y: number) {
    let roomName: string
    switch (q) {
        case 0:
            roomName = `W${x}N${y}`
            break
        case 1:
            roomName = `W${x}S${y}`
            break
        case 2:
            roomName = `E${x}N${y}`
            break
        case 3:
            roomName = `E${x}S${y}`
            break
        default:
            roomName = 'ERROR'
    }
    return roomName
}

/**
 * Packs a RoomPosition as a 3 Uint8 characters.
 */
export function packPos(pos: RoomPosition) {
    const map = packRoomName(pos.roomName)
    return encode(new Uint8Array([map.quadrant, map.x, map.y, pos.x, pos.y]))
}

/**
 * Packs a RoomPosition as a 3 Uint8 characters.
 */
export function packXYAsPos(x: number, y: number, roomName: string) {
    const map = packRoomName(roomName)
    return encode(new Uint8Array([map.quadrant, map.x, map.y, x, y]))
}

/**
 * Unpacks a RoomPosition stored as a pair of Base32768 characters.
 */
export function unpackPos(chars: string) {
    const pos = decode(chars)
    return new RoomPosition(pos[3], pos[4], unpackRoomName(pos[0], pos[1], pos[2]))
}

/**
 * Packs a list of RoomPositions as a Base32768 string. This is better than having a list of packed RoomPositions, as it
 * avoids extra commas and "" when memory gets stringified.
 */
export function packPosList(posList: RoomPosition[]) {
    let str = ''

    for (const pos of posList) {
        str += packXYAsPos(pos.x, pos.y, pos.roomName)
    }
    return str
}

/**
 * Unpacks a list of RoomPositions stored as a Base32768 string.
 */
export function unpackPosList(chars: string) {
    const posList: RoomPosition[] = []
    for (let i = 0; i < chars.length; i += packedPosLength) {
        posList.push(unpackPos(chars[i] + chars[i + 1] + chars[i + 2]))
    }
    return posList
}
/**
 * Unpacks a single RoomPosition of a list stored as a Base32768 string.
 */
export function unpackPosAt(chars: string, index = 0) {
    if (chars.length < packedPosLength * (index + 1)) return undefined

    return unpackPos(chars.slice(packedPosLength * index, packedPosLength * (index + 1)))
}

/**
 * Pack a planned cord for base building
 */
export function packBasePlanCoord(planCoords: BasePlanCoord[]) {
    let packedCoords = ''
    const lastIndex = planCoords.length - 1

    for (let i = 0; i < planCoords.length; i++) {

        const planCoord = planCoords[i]
        packedCoords += encode(new Uint8Array([buildableStructureTypes.indexOf(planCoord.structureType), planCoord.minRCL]))
        if (i < lastIndex) packedCoords += ','
    }
    packedCoords += '_'
    return packedCoords
}

/**
 * Unpack a planned cord for base building
 */
export function unpackBasePlanCoords(packedPlanCoords: string) {
    const planCoords: BasePlanCoord[] = []

    for (const packedPlanCoord of packedPlanCoords.split(',')) {
        if (!packedPlanCoord.length) continue

        const data = decode(packedPlanCoord)
        planCoords.push({ structureType: buildableStructureTypes[data[0]], minRCL: data[1] })
    }
    return planCoords
}

/**
 * Pack a planned cord for base building
 */
export function packRampartPlanCoord(planCoord: RampartPlanCoord) {
    return encode(
        new Uint8Array([planCoord.minRCL, planCoord.coversStructure, planCoord.buildForNuke, planCoord.buildForThreat]),
    )
}

/**
 * Unpack a planned cord for base building
 */
export function unpackRampartPlanCoord(chars: string): RampartPlanCoord {
    const coord = decode(chars)
    return { minRCL: coord[0], coversStructure: coord[1], buildForNuke: coord[2], buildForThreat: coord[3] }
}

export function packStampAnchors(stampAnchors: StampAnchors) {
    const packedStampAnchors: PackedStampAnchors = {}

    for (const key in stampAnchors) {
        const structureType = key as StampTypes

        packedStampAnchors[stampKeys.indexOf(structureType)] = packCoordList(stampAnchors[structureType])
    }

    return packedStampAnchors
}

export function unpackStampAnchors(packedStampAnchors: PackedStampAnchors) {
    const stampAnchors: StampAnchors = {}

    for (const key in packedStampAnchors) {
        stampAnchors[stampKeys[parseInt(key)]] = unpackCoordList(packedStampAnchors[key])
    }

    return stampAnchors
}
