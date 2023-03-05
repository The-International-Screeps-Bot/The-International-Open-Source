/**
 * Created Nov. 2022 by @clarkok
 * Modified by @Carson
 *
 * Finding the minimum weighted rampart locations for the game Screeps, with the altered Edmonds–Karp algorithm.
 *
 * Other implementations typically find the min-cut on the edges between tiles, and then find the tiles around those
 * edges to form the final result. This is guaranteed to give a cut between safe spots and the exits, but there can be
 * edge cases where the non-optimal results can be returned.
 *
 * This implementation, on the other hand, converts the problem to find the cut on the tiles themselves, so it is
 * guaranteed to return the optimal result. And during the problem-conversion, there is a opportunity to support the
 * features to allow tiles have different weights, which is useful to model the construction cost.
 *
 * So how do we convert the tile-cut problem to a edge-cut one?
 *
 * The idea is for each tile, we split it into a s-node and a d-node, and connect them with an edge whose initial
 * capacity is the weight of that tile. And for each edge connecting two tiles A and B, we add an edge from A's d-node
 * to B's s-node, and A's s-node to B's d-node, with initial capacities of both being infinity.
 *
 * Then we run the traditional min-cut algorithm on the graph, and the cut will always select the edges connecting
 * the s-node and d-node of the same tile. After we get the edge-cut solution, we can go find those tiles whose
 * internal edges are all selected, and those are the tiles we want.
 *
 * In the implementation, we are operating on a graph of course, however we don't have a clear node representation.
 * Instead, we are using a 13-bit integer to represent a node, and using the `capacityMap` below to describe the
 * connections between nodes.
 *
 * The 13-bit integer is composed of 12-bit index and 1-bit flag, where the lower 12 bits encodes the location of the
 * tile, and the highest bit indicates whether it is a s-node or a d-node. Note that the so-called s-node and d-node
 * are just names, they are regular nodes in the graph, and makes no difference to the min-cut algorithm itself. We
 * are differentiating them only because we want to find the cut on the tiles, and not on the edges.
 *
 * The capacityMap, on the other hand, records the current capacity of all the edges in the graph. The key of the map
 * is a 17-bit integer, encoding the source of the edge and the direction. The destination of the edge can be then
 * calculated. The lower 13-bit of the integer is the source node id as described above, and the highest 4-bit is the
 * direction. 0-7 are the 8 directions to the 8 surrounding tiles, and 8 is the direction from a s-node to its
 * corresponding d-node or vice versa.
 *
 * The capacity of an edge is the amount of flow that can be pushed through it. The capacity of an edge is always
 * non-negative. When the capacity of an edge is 0, it means the edge is saturated, and no more flow can be pushed
 * through it, so the bfs from the sources to the sinks will not traverse it.
 *
 * Besides the capacityMap, we also maintain a last[] array during the bfs rounds. The key being a node id, the value
 * being the last node id on the path from the source to the node, and the direction from the last node to the node.
 * This is used to trace back the path from the sink to the source, and find the edges on the path. -2 in the array
 * means the node is not yet visited, and -1 means the node is one of the sources.
 *
 * So the overall algorithm is simple:
 *
 * Let maxFlow = 0
 * Repeat:
 *   Run a bfs in the graph to find a path from the sources to the sinks.
 *   If non-path can be found, break the loop.
 *   Otherwise, find the minimum capacity C in the path, and for each edge in the path:
 *     Reduce the capacity of the edge by C
 *     Increase the capacity of the reverse edge by C
 *   maxFlow += C
 * // Now the maxFlow has been calculated, and the capacityMap altered
 * Run a tile-based bfs on the costMap from the sources, and find all the tiles where the capacity from s-node to
 * d-node is 0, and those are the tiles we want.
 *
 * We also introduced some optimization to reuse bfs result, especially the last[] array to reduce the work of
 * each round of bfs. See the comments in the code for details.
 */

import { customColors, roomDimensions } from 'international/constants'
import { internationalManager } from 'international/international'
import { customLog, findCoordsInRangeXY, isXYInBorder, packXYAsNum, unpackNumAsCoord } from 'international/utils'

// the eight surrounding points of a tile
// note the order here is somehow important, the element i and (i + 4) % 8 should be the opposite direction
const EIGHT_DELTA = [
    { x: 0, y: -1 }, // TOP
    { x: 1, y: -1 }, // TOP_RIGHT
    { x: 1, y: 0 }, // RIGHT
    { x: 1, y: 1 }, // BOTTOM_RIGHT
    { x: 0, y: 1 }, // BOTTOM
    { x: -1, y: 1 }, // BOTTOM_LEFT
    { x: -1, y: 0 }, // LEFT
    { x: -1, y: -1 }, // TOP_LEFT
]

function isCoordInRoom(p: Coord): boolean {
    return p.x >= 0 && p.x <= 49 && p.y >= 0 && p.y <= 49
}

function pointAdd(a: Coord, b: Coord): Coord {
    return { x: a.x + b.x, y: a.y + b.y }
}

function surroundingCoords(p: Coord): Coord[] {
    return EIGHT_DELTA.map(d => pointAdd(p, d)).filter(isCoordInRoom)
}

class Int32Queue {
    private q: Int32Array
    private h: number
    private t: number

    constructor(capacity: number) {
        this.q = new Int32Array(capacity)
        this.h = this.t = 0
    }

    reset(arr: number[]) {
        this.q.set(arr)
        this.h = 0
        this.t = arr.length
    }

    push(v: number) {
        this.q[this.t] = v
        this.t = (this.t + 1) % this.q.length
    }

    shift(): number {
        const v = this.q[this.h]
        this.h = (this.h + 1) % this.q.length
        return v
    }

    get length(): number {
        return (this.t - this.h + this.q.length) % this.q.length
    }

    clear() {
        this.t = this.h = 0
    }
}

const MAX_PT = 1 << 12
const PT_MASK = MAX_PT - 1

// the bit to indicate a d-node in the 13-bits node id
const D_NODE = 1 << 12

// max encoded node id, there can only be at most 5000 nodes in the graph, some
// spaces are wasted
const MAX_NODE = 1 << 13

// the edge connecting s-node and d-node
const REV_EDGE = 1 << 16

// direction shift in the encoded edge
const DIR_SHIFT = 13

export function minCutToExit(sources: Coord[], costMap: CostMatrix): Coord[] {
    // an array indicating whether a point is at the exit or near the exit
    const exit = new Uint8Array(MAX_PT)
    for (let i = 0; i < 49; ++i) {
        for (const [x, y] of [
            [i, 0],
            [49, i],
            [49 - i, 49],
            [0, 49 - i],
        ]) {
            if (costMap.get(x, y) == 255) {
                continue
            }
            exit[packXYAsNum(x, y)] = 1
            for (const p of surroundingCoords({ x, y })) {
                exit[packXYAsNum(p.x, p.y)] = 1
            }
        }
    }

    for (const s of sources) {
        if (exit[packXYAsNum(s.x, s.y)]) {
            throw new Error(`Invalid source ${s.x},${s.y}`)
        }
    }

    // setup the capacity map, the keys are the encoded edges
    // 0-12 bits    - source node
    //   0-11 bits      - the packed location of the source node
    //   12 bit         - s-node or the d-node
    // 13-16 bits   - direction of the edge, 0-7 means the edge goes to another
    // location, while 8 means the edge goes from s-node to d-node or vice versa
    const capacityMap = new Int32Array(1 << 17)
    capacityMap.fill(0)
    for (let y = 0; y < 50; ++y) {
        for (let x = 0; x < 50; ++x) {
            if (costMap.get(x, y) == 255) {
                continue
            }

            const idx = packXYAsNum(x, y)

            // setting up the capacity of the edge from s-node to the d-node at the
            // location x,y
            capacityMap[idx | REV_EDGE] = costMap.get(x, y)

            // setting up the capacity of the edges from d-node to s-nodes of the
            // surrounding locations
            for (let dir = 0; dir < EIGHT_DELTA.length; ++dir) {
                const np = pointAdd({ x, y }, EIGHT_DELTA[dir]) // next point
                if (!isCoordInRoom(np)) {
                    continue
                }

                if (costMap.get(np.x, np.y) == 255) {
                    continue
                }

                capacityMap[idx | D_NODE | (dir << DIR_SHIFT)] = 10000 // almost infinite
            }
        }
    }

    // storing the previous node, and the edge direction in the path found from
    // the sources to the sinks the keys are the encoded nodes the values are
    //   -2: the node is not visited
    //   -1: the node is in the sources set
    //   (direction << 16) | prev_node_id: by which node the current node is
    //   visited, and the direction of the edge
    const last = new Int32Array(MAX_NODE)
    last.fill(-2)

    // whether or not a node is in the bfsQ
    const added = new Uint8Array(MAX_NODE)
    added.fill(0)

    // the queue for bfs
    const bfsQ = new Int32Queue(MAX_NODE)

    for (const p of sources) {
        const pidx = packXYAsNum(p.x, p.y)
        last[pidx] = -1
        added[pidx] = 1
        bfsQ.push(pidx)
    }

    // bfs to find a path from the sources to the sinks, returns the sink point or
    // null if no path is found
    const bfs = (): Coord | null => {
        while (bfsQ.length) {
            const opidx = bfsQ.shift() // original node id
            added[opidx] = 0

            if (last[opidx] == -2) {
                // if the node is no-longer reachable from the sources, skip it
                // this can happen during the loosen operation below, after we reduce
                // the capacity of some edges to zero, the descendants of the node may
                // become unreachable and requires a next bfs round to be re-discovered

                continue
            }

            // checking the edge to its counterpart, from s-node to d-node or vice versa
            if (capacityMap[opidx | REV_EDGE]) {
                const onpidx = opidx ^ D_NODE // the counterpart node id
                if (last[onpidx] == -2) {
                    last[onpidx] = (8 << 16) | opidx

                    // note that we don't need to check the `added` flag here, in `bfs`
                    // we won't add a node to the queue twice
                    added[onpidx] = 1
                    bfsQ.push(onpidx)
                }
            }

            // checking the edges to the surrounding nodes
            const pidx = opidx & PT_MASK // the packed location of the node
            const p = unpackNumAsCoord(pidx)
            const npCounterpartFlag = (opidx ^ D_NODE) & D_NODE
            for (let dir = 0; dir < EIGHT_DELTA.length; ++dir) {
                if (capacityMap[opidx | (dir << DIR_SHIFT)] == 0) {
                    continue
                }

                const np = pointAdd(p, EIGHT_DELTA[dir]) // next point
                const npidx = packXYAsNum(np.x, np.y)

                // the destination node id, note that the D_NODE flag is different from the opidx node
                // also note that we don't need to check if the next point is outside the room, this is impossible
                const onpidx = npidx | npCounterpartFlag

                if (exit[npidx]) {
                    // exit! we successfully found a path from the sources to the sinks
                    // here the last[onpidx] won't be -2, because it is guarenteed that
                    // it is the first time this node is visited by this round of bfs

                    // we will also leave the rest of nodes in the queue, and continue the bfs in the next iteration
                    last[onpidx] = (dir << 16) | opidx
                    return np
                }

                if (last[onpidx] != -2) {
                    continue
                }

                last[onpidx] = (dir << 16) | opidx
                added[onpidx] = 1
                bfsQ.push(onpidx)
            }
        }

        return null
    }

    // given a node and a dir, return the destination node and the dir to return from source node
    const revEdge = (opidx: number, dir: number): [number, number] => {
        if (dir == 8) {
            return [opidx ^ D_NODE, 8]
        }

        const pidx = opidx & PT_MASK
        const p = unpackNumAsCoord(pidx)
        const np = pointAdd(p, EIGHT_DELTA[dir])
        const onpidx = packXYAsNum(np.x, np.y) | ((opidx ^ D_NODE) & D_NODE)
        return [onpidx, (dir + 4) % 8]
    }

    // a queue for the traversal in the loosen operation, to find nodes whose reachability from the sources changes
    const looseQ = new Int32Queue(MAX_NODE)

    // a queue for the adding back nodes to the bfsQ in the loosen operation
    const readdQ = new Int32Queue(MAX_NODE)

    // the loosen operation, called with the sink point found by bfs, would do 3 things
    //   1. go through the path from the sources to this sink, finding the minimum capacity of the edges in the path,
    //      substract the minimum capacity from all the edges in the path, and add it to all the reverse edges
    //   2. using another bfs to find all the nodes whose reachability from the sources changes, with the looseQ, reset
    //      their last[] to -2, and add them to the readdQ
    //   3. for each the nodes in the readdQ, add all the source-reachable nodes with a non-zero-capacity edge to this node
    //      back to the bfsQ, so the next iteration can continue from these nodes
    const loosen = (p: Coord) => {
        // step 1.a: find the minimum capacity
        let minCapacity = Infinity
        let highestPt = -1 // the closest node in the path to the sources, where the edge from it is one of the minimum capacity edges
        // we will start from here to find all the nodes whose reachability from the sources changes
        for (let res = last[packXYAsNum(p.x, p.y)]; res != -1; ) {
            const l = res & 0xffff
            const d = res >> 16
            const capacity = capacityMap[l | (d << DIR_SHIFT)]
            if (capacity <= minCapacity) {
                minCapacity = capacity
                highestPt = l
            }
            res = last[l]
        }

        // step 1.b: loosen the edges
        for (let res = last[packXYAsNum(p.x, p.y)]; res != -1; ) {
            const l = res & 0xffff
            const d = res >> 16
            capacityMap[l | (d << DIR_SHIFT)] -= minCapacity

            const [rl, rd] = revEdge(l, d)
            capacityMap[rl | (rd << DIR_SHIFT)] += minCapacity

            res = last[l]
        }

        // step 2: find all the nodes whose reachability from the sources changes
        // we follows the last[] direction instead of the capacityMap[]
        looseQ.push(highestPt)
        while (looseQ.length) {
            const opidx = looseQ.shift()

            // counterpart
            {
                const onpidx = opidx ^ D_NODE
                if (last[onpidx] == (opidx | (8 << 16))) {
                    last[onpidx] = -2
                    looseQ.push(onpidx)
                    readdQ.push(onpidx)
                }
            }

            const pidx = opidx & PT_MASK
            const p = unpackNumAsCoord(pidx)
            const npCounterpartFlag = (opidx ^ D_NODE) & D_NODE

            for (let dir = 0; dir < EIGHT_DELTA.length; ++dir) {
                const np = pointAdd(p, EIGHT_DELTA[dir])
                const onpidx = packXYAsNum(np.x, np.y) | npCounterpartFlag

                if (last[onpidx] == (opidx | (dir << 16))) {
                    last[onpidx] = -2
                    looseQ.push(onpidx)
                    readdQ.push(onpidx)
                }
            }
        }

        // step 3: add those nodes that can goes forward back to bfsQ
        while (readdQ.length) {
            const opidx = readdQ.shift()
            for (let dir = 0; dir < EIGHT_DELTA.length + 1; ++dir) {
                const [onpidx, rd] = revEdge(opidx, dir)
                const pidx = onpidx & PT_MASK
                if (last[onpidx] != -2 && !exit[pidx] && !added[onpidx] && capacityMap[onpidx | (rd << DIR_SHIFT)]) {
                    added[onpidx] = 1
                    bfsQ.push(onpidx)
                }
            }
        }
    }

    // the main loop, loosen the graph until we can't find a path from the sources to the sinks
    for (let p = bfs(); p != null; p = bfs()) {
        loosen(p)
    }

    // collecting the result, we do a bfs from source, and collect points where the edge between s-node and d-node has zero capacity
    // those points is what we need for the ramparts or walls
    const ret: Coord[] = []
    const visited = new Uint8Array(MAX_NODE)
    const q = sources.map(p => packXYAsNum(p.x, p.y))
    for (const p of q) {
        visited[p] = 1
    }

    while (q.length) {
        const sidx = q.shift()!
        const didx = sidx | D_NODE
        const p = unpackNumAsCoord(sidx)

        if (last[sidx] != -2 && last[didx] == -2) {
            ret.push(p)
        }

        for (const np of surroundingCoords(p)) {
            if (!isCoordInRoom(np)) {
                continue
            }

            if (visited[packXYAsNum(np.x, np.y)]) {
                continue
            }

            if (costMap.get(np.x, np.y) == 255) {
                continue
            }

            const npidx = packXYAsNum(np.x, np.y)
            visited[npidx] = 1
            q.push(npidx)
        }
    }

    return ret
}
