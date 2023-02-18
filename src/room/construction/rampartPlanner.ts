import {
    defaultRoadPlanningPlainCost,
    EXIT,
    maxRampartGroupSize,
    minOnboardingRamparts,
    customColors,
    NORMAL,
    PROTECTED,
    roomDimensions,
    stamps,
    TO_EXIT,
    UNWALKABLE,
} from 'international/constants'
import {
    createPosMap,
    customLog,
    findCoordsInsideRect,
    packAsNum,
    packXYAsNum,
    unpackNumAsCoord,
    unpackNumAsPos,
} from 'international/utils'
import { internationalManager } from 'international/international'
import { CommuneManager } from 'room/commune/commune'

/*
- Posted 10 may 2018 by @saruss
- Code for calculating the minCut in a room, written by Saruss
- some readability added by Chobobobo for typescript
- Fixed Game.map.getTerrainAt to Game.map.getRoomTerrain method -Shibdib
- Formatted, optimized, added readability, structurally improved and modified for typescript by Carson Burke
*/
export class RampartPlanner {
    communeManager: CommuneManager

    level: any[]
    v: number
    edges: any

    constructor(communeManager: CommuneManager, menge_v: number) {
        this.communeManager = communeManager
    }

    public run() {}

    private findRoomCoordInfo() {
        this.communeManager.room.tileCoords = new Uint8Array(2500)

        const terrain = this.communeManager.room.getTerrain()

        for (let x = 0; x < roomDimensions; x += 1) {
            for (let y = 0; y < roomDimensions; y += 1) {
                const packedCoord = packXYAsNum(x, y)

                this.communeManager.room.tileCoords[packedCoord] = UNWALKABLE

                if (terrain.get(x, y) === TERRAIN_MASK_WALL) continue

                this.communeManager.room.tileCoords[packedCoord] = NORMAL

                if (x === 0 || y === 0 || x === roomDimensions - 1 || y === roomDimensions - 1)
                    this.communeManager.room.tileCoords[packedCoord] = EXIT
            }
        }

        // Marks tiles Near Exits for sink- where you cannot build wall/rampart

        let y = 1

        for (; y < roomDimensions - 1; y += 1) {
            if (this.communeManager.room.tileCoords[packXYAsNum(0, y - 1)] === EXIT) this.communeManager.room.tileCoords[packXYAsNum(1, y)] = TO_EXIT
            if (this.communeManager.room.tileCoords[packXYAsNum(0, y)] === EXIT) this.communeManager.room.tileCoords[packXYAsNum(1, y)] = TO_EXIT
            if (this.communeManager.room.tileCoords[packXYAsNum(0, y + 1)] === EXIT) this.communeManager.room.tileCoords[packXYAsNum(1, y)] = TO_EXIT

            if (this.communeManager.room.tileCoords[packXYAsNum(roomDimensions - 1, y - 1)] === EXIT)
                this.communeManager.room.tileCoords[packXYAsNum(roomDimensions - 2, y)] = TO_EXIT
            if (this.communeManager.room.tileCoords[packXYAsNum(roomDimensions - 1, y)] === EXIT)
                this.communeManager.room.tileCoords[packXYAsNum(roomDimensions - 2, y)] = TO_EXIT
            if (this.communeManager.room.tileCoords[packXYAsNum(roomDimensions - 1, y + 1)] === EXIT)
                this.communeManager.room.tileCoords[packXYAsNum(roomDimensions - 2, y)] = TO_EXIT
        }

        let x = 1

        for (; x < roomDimensions - 1; x += 1) {
            if (this.communeManager.room.tileCoords[packXYAsNum(x - 1, 0)] === EXIT) this.communeManager.room.tileCoords[packXYAsNum(x, 1)] = TO_EXIT
            if (this.communeManager.room.tileCoords[packXYAsNum(x, 0)] === EXIT) this.communeManager.room.tileCoords[packXYAsNum(x, 1)] = TO_EXIT
            if (this.communeManager.room.tileCoords[packXYAsNum(x + 1, 0)] === EXIT) this.communeManager.room.tileCoords[packXYAsNum(x, 1)] = TO_EXIT

            if (this.communeManager.room.tileCoords[packXYAsNum(x - 1, roomDimensions - 1)] === EXIT)
                this.communeManager.room.tileCoords[packXYAsNum(x, roomDimensions - 2)] = TO_EXIT
            if (this.communeManager.room.tileCoords[packXYAsNum(x, roomDimensions - 1)] === EXIT)
                this.communeManager.room.tileCoords[packXYAsNum(x, roomDimensions - 2)] = TO_EXIT
            if (this.communeManager.room.tileCoords[packXYAsNum(x + 1, roomDimensions - 1)] === EXIT)
                this.communeManager.room.tileCoords[packXYAsNum(x, roomDimensions - 2)] = TO_EXIT
        }

        // mark Border Tiles as not usable

        y = 1

        for (; y < roomDimensions - 1; y += 1) {
            this.communeManager.room.tileCoords[packXYAsNum(0, y)] === UNWALKABLE
            this.communeManager.room.tileCoords[packXYAsNum(roomDimensions - 1, y)] === UNWALKABLE
        }

        x = 1

        for (; x < roomDimensions - 1; x += 1) {
            this.communeManager.room.tileCoords[packXYAsNum(x, 0)] === UNWALKABLE
            this.communeManager.room.tileCoords[packXYAsNum(x, roomDimensions - 1)] === UNWALKABLE
        }
    }

    private createGraph(rects: Rect[]) {
        this.findRoomCoordInfo()

        // Loop through each rect

        for (const rect of rects) {
            // Loop through each pos inside the rect

            for (let x = rect.x1; x <= rect.x2; x += 1) {
                for (let y = rect.y1; y <= rect.y2; y += 1) {
                    // If the pos is NORMAL and on the edge of the rect

                    if (x === rect.x1 || x === rect.x2 || y === rect.y1 || y === rect.y2) {
                        // Set the pos to protected, and iterate

                        if (this.communeManager.room.tileCoords[packXYAsNum(x, y)] === NORMAL)
                            this.communeManager.room.tileCoords[packXYAsNum(x, y)] = PROTECTED
                        continue
                    }

                    // Otherwise set the pos as unwalkable

                    this.communeManager.room.tileCoords[packXYAsNum(x, y)] = UNWALKABLE
                }
            }
        }
        /*

        if (Memory.baseVisuals) {
            // Visualize position values

            for (let x = 0; x < roomDimensions; x += 1) {
                for (let y = 0; y < roomDimensions; y += 1) {
                    const tileType = room.tileCoords[packXYAsNum(x, y)]

                    if (tileType === NORMAL) {
                        room.visual.rect(x - 0.5, y - 0.5, 1, 1, {
                            fill: customColors.yellow,
                            opacity: 0.3,
                        })
                        continue
                    }

                    if (tileType === PROTECTED) {
                        room.visual.rect(x - 0.5, y - 0.5, 1, 1, {
                            fill: customColors.green,
                            opacity: 0.3,
                        })
                        continue
                    }

                    if (tileType === UNWALKABLE) {
                        room.visual.rect(x - 0.5, y - 0.5, 1, 1, {
                            fill: customColors.red,
                            opacity: 0.3,
                        })
                        continue
                    }
                }
            }
        }
 */
        // initialise graph
        // possible 2*50*50 +2 (st) Vertices (Walls etc set to unused later)

        // Vertex count

        this.v = 2 * 50 * 50 + 2
        this.level = Array(this.v)

        // Array: for every vertex an edge Array mit {v,r,c,f} vertex_to,res_edge,capacity,flow

        this.edges = Array(this.v)
            .fill(0)
            .map(x => [])

        const infini = Number.MAX_VALUE
        const surr = [
            [0, -1],
            [-1, -1],
            [-1, 0],
            [-1, 1],
            [0, 1],
            [1, 1],
            [1, 0],
            [1, -1],
        ]
        // per Tile (0 in Array) top + bot with edge of c=1 from top to bott  (use every tile once!)
        // infini edge from bot to top vertices of adjacent tiles if they not protected (array =1) (no reverse edges in normal graph)
        // per prot. Tile (1 in array) Edge from source to this tile with infini cap.
        // per exit Tile (2in array) Edge to sink with infini cap.
        // source is at  pos 2*50*50, sink at 2*50*50+1 as first tile is 0,0 => pos 0
        // top vertices <-> x,y : v=y*50+x   and x= v % 50  y=v/50 (math.floor?)
        // bot vertices <-> top + 2500

        const source = 2 * 50 * 50
        const sink = 2 * 50 * 50 + 1

        let dx = 0
        let dy = 0

        for (let x = 1; x < roomDimensions - 1; x += 1) {
            for (let y = 1; y < roomDimensions - 1; y += 1) {
                const top = y * 50 + x
                const bot = top + 2500

                if (this.communeManager.room.tileCoords[packXYAsNum(x, y)] === NORMAL) {
                    // normal Tile
                    this.newEdge(top, bot, 1)

                    for (let i = 0; i < 8; i += 1) {
                        dx = x + surr[i][0]
                        dy = y + surr[i][1]

                        if (
                            this.communeManager.room.tileCoords[packXYAsNum(dx, dy)] === NORMAL ||
                            this.communeManager.room.tileCoords[packXYAsNum(dx, dy)] === TO_EXIT
                        )
                            this.newEdge(bot, dy * 50 + dx, infini)
                    }

                    continue
                }

                if (this.communeManager.room.tileCoords[packXYAsNum(x, y)] === PROTECTED) {
                    // protected Tile
                    this.newEdge(source, top, infini)
                    this.newEdge(top, bot, 1)

                    for (let i = 0; i < 8; i += 1) {
                        dx = x + surr[i][0]
                        dy = y + surr[i][1]

                        if (
                            this.communeManager.room.tileCoords[packXYAsNum(dx, dy)] === NORMAL ||
                            this.communeManager.room.tileCoords[packXYAsNum(dx, dy)] === TO_EXIT
                        )
                            this.newEdge(bot, dy * 50 + dx, infini)
                    }

                    continue
                }

                if (this.communeManager.room.tileCoords[packXYAsNum(x, y)] === TO_EXIT) {
                    // near Exit
                    this.newEdge(top, sink, infini)
                    continue
                }
            }
        }
    }

    private newEdge(u: number, v: number, c: number) {
        // Normal forward Edge

        this.edges[u].push({ v, r: this.edges[v].length, c, f: 0 })

        // reverse Edge for Residal Graph

        this.edges[v].push({ v: u, r: this.edges[u].length - 1, c: 0, f: 0 })
    }

    private breadthFirstSearch(s: number, t: number) {
        // calculates Level Graph and if theres a path from s to t

        if (t >= this.v) return false

        this.level.fill(-1) // reset old levels
        this.level[s] = 0
        const q = [] // queue with s as starting point

        q.push(s)

        let u = 0
        let edge = null

        while (q.length) {
            u = q.splice(0, 1)[0]
            let i = 0
            const imax = this.edges[u].length

            for (; i < imax; i += 1) {
                edge = this.edges[u][i]

                if (this.level[edge.v] < 0 && edge.f < edge.c) {
                    this.level[edge.v] = this.level[u] + 1
                    q.push(edge.v)
                }
            }
        }

        // return if theres a path to t -> no level, no path!

        return this.level[t] >= 0
    }

    private depthFirstSearchFlow(u: number, f: number, t: number, c: any[]) {
        // Sink reached, abort recursion

        if (u === t) return f

        let edge = null
        let flow_till_here = 0
        let flow_to_t = 0

        while (c[u] < this.edges[u].length) {
            // Visit all edges of the vertex  one after the other

            edge = this.edges[u][c[u]]

            if (this.level[edge.v] === this.level[u] + 1 && edge.f < edge.c) {
                // Edge leads to Vertex with a level one higher, and has flow left

                flow_till_here = Math.min(f, edge.c - edge.f)
                flow_to_t = this.depthFirstSearchFlow(edge.v, flow_till_here, t, c)

                if (flow_to_t > 0) {
                    edge.f += flow_to_t // Add Flow to current edge
                    this.edges[edge.v][edge.r].f -= flow_to_t // subtract from reverse Edge -> Residual Graph neg. Flow to use backward direction of BFS/DFS
                    return flow_to_t
                }
            }
            c[u] += 1
        }
        return 0
    }

    private breadthFirstCut(s: number) {
        const e_in_cut = []
        this.level.fill(-1)
        this.level[s] = 1
        const q = []

        q.push(s)

        let u = 0
        let edge = null

        while (q.length) {
            u = q.splice(0, 1)[0]
            let i = 0
            const imax = this.edges[u].length

            for (; i < imax; i += 1) {
                edge = this.edges[u][i]

                if (edge.f < edge.c) {
                    if (this.level[edge.v] < 1) {
                        this.level[edge.v] = 1
                        q.push(edge.v)
                    }
                }
                if (edge.f === edge.c && edge.c > 0) {
                    // blocking edge -> could be in min cut
                    edge.u = u
                    e_in_cut.push(edge)
                }
            }
        }

        const min_cut = []
        let i = 0
        const imax = e_in_cut.length

        for (; i < imax; i += 1) {
            // Only edges which are blocking and lead to from s unreachable vertices are in the min cut

            if (this.level[e_in_cut[i].v] === -1) min_cut.push(e_in_cut[i].u)
        }
        return min_cut
    }

    private findMinCut(s: number, t: number) {
        if (s === t) return -1

        let returnValue = 0

        while (this.breadthFirstSearch(s, t) === true) {
            const count = Array(this.v + 1).fill(0)
            let flow = 0

            do {
                flow = this.depthFirstSearchFlow(s, Number.MAX_VALUE, t, count)
                if (flow > 0) returnValue += flow
            } while (flow)
        }

        return returnValue
    }

    // Removes unneccary cut-tiles if bounds are set to include some 	dead ends

    private deleteTilesToDeadEnds(cutCoords: Coord[]) {
        for (let i = cutCoords.length - 1; i >= 0; i -= 1)
            this.communeManager.room.tileCoords[packXYAsNum(cutCoords[i].x, cutCoords[i].y)] = UNWALKABLE

        // Floodfill from exits: save exit tiles in array and do a bfs-like search

        const unvisited_pos = []
        let y = 0

        for (; y < roomDimensions - 1; y += 1) {
            if (this.communeManager.room.tileCoords[packXYAsNum(1, y)] === TO_EXIT) unvisited_pos.push(50 * y + 1)
            if (this.communeManager.room.tileCoords[packXYAsNum(48, y)] === TO_EXIT) unvisited_pos.push(50 * y + 48)
        }

        let x = 0

        for (; x < roomDimensions - 1; x += 1) {
            if (this.communeManager.room.tileCoords[packXYAsNum(x, 1)] === TO_EXIT) unvisited_pos.push(50 + x)
            if (this.communeManager.room.tileCoords[packXYAsNum(x, 48)] === TO_EXIT) unvisited_pos.push(2400 + x) // 50*48=2400
        }

        // Iterate over all unvisited TO_EXIT- Tiles and mark neigbours as TO_EXIT tiles, if walkable (NORMAL), and add to unvisited

        const surr = [
            [0, -1],
            [-1, -1],
            [-1, 0],
            [-1, 1],
            [0, 1],
            [1, 1],
            [1, 0],
            [1, -1],
        ]
        let index
        let dx
        let dy

        while (unvisited_pos.length > 0) {
            index = unvisited_pos.pop()
            x = index % 50
            y = Math.floor(index / 50)

            for (let i = 0; i < 8; i += 1) {
                dx = x + surr[i][0]
                dy = y + surr[i][1]

                if (this.communeManager.room.tileCoords[packXYAsNum(dx, dy)] === NORMAL) {
                    unvisited_pos.push(50 * dy + dx)
                    this.communeManager.room.tileCoords[packXYAsNum(dx, dy)] = TO_EXIT
                }
            }
        }

        // Remove min-Cut-Tile if there is no TO-EXIT  surrounding it
        let leads_to_exit = false

        for (let i = cutCoords.length - 1; i >= 0; i -= 1) {
            leads_to_exit = false
            x = cutCoords[i].x
            y = cutCoords[i].y

            for (let i = 0; i < 8; i += 1) {
                dx = x + surr[i][0]
                dy = y + surr[i][1]

                if (this.communeManager.room.tileCoords[packXYAsNum(dx, dy)] === TO_EXIT) {
                    leads_to_exit = true
                }
            }

            if (!leads_to_exit) cutCoords.splice(i, 1)
        }
    }

    // Function for user: calculate min cut tiles from room, rect[]

    private GetCutTiles(rects: Rect[]) {
        // Position Source / Sink in Room-Graph

        const source = 2 * 50 * 50

        const sink = 2 * 50 * 50 + 1

        const positions: Coord[] = []
        const packedPositions: number[] = []

        if (this.findMinCut(source, sink) > 0) {
            const cutEdges = this.breadthFirstCut(source)

            // Get Positions from Edge

            for (let i = 0; i < cutEdges.length; i += 1) {
                const packedCoord = cutEdges[i]

                positions.push(unpackNumAsCoord(packedCoord))
                packedPositions.push(packedCoord)
            }
        }

        // if bounds are given,
        // try to dectect islands of walkable tiles, which are not conntected to the exits, and delete them from the cut-tiles

        if (positions.length > 0) this.deleteTilesToDeadEnds(positions)

        return packedPositions
    }

    private recordProtectedAreas() {
        // Rectangle Array, the Rectangles will be protected by the returned tiles

        const protectionRects: Rect[] = []

        // Protect it

        protectionRects.push({
            x1: Math.max(Math.min(this.communeManager.room.controller.pos.x - 1, roomDimensions - 3), 2),
            y1: Math.max(Math.min(this.communeManager.room.controller.pos.y - 1, roomDimensions - 3), 2),
            x2: Math.max(Math.min(this.communeManager.room.controller.pos.x + 1, roomDimensions - 3), 2),
            y2: Math.max(Math.min(this.communeManager.room.controller.pos.y + 1, roomDimensions - 3), 2),
        })

        // Get the centerUpgradePos

        const centerUpgradePos = this.communeManager.room.centerUpgradePos
        if (!centerUpgradePos) return false

        // Protect it

        protectionRects.push({
            x1: Math.max(Math.min(centerUpgradePos.x - 3, roomDimensions - 3), 2),
            y1: Math.max(Math.min(centerUpgradePos.y - 3, roomDimensions - 3), 2),
            x2: Math.max(Math.min(centerUpgradePos.x + 3, roomDimensions - 3), 2),
            y2: Math.max(Math.min(centerUpgradePos.y + 3, roomDimensions - 3), 2),
        })

        /*
 let closestSourcePos = room.sourcePositions[0][0]

 // Protect it

 protectionRects.push({
      x1: Math.max(Math.min(closestSourcePos.x - 2, roomDimensions - 3), 2),
      y1: Math.max(Math.min(closestSourcePos.y - 2, roomDimensions - 3), 2),
      x2: Math.max(Math.min(closestSourcePos.x + 2, roomDimensions - 3), 2),
      y2: Math.max(Math.min(closestSourcePos.y + 2, roomDimensions - 3), 2),
 })

 closestSourcePos = room.sourcePositions[1][0]

 if (closestSourcePos) {

      // Protect it

      protectionRects.push({
           x1: Math.max(Math.min(closestSourcePos.x - 2, roomDimensions - 3), 2),
           y1: Math.max(Math.min(closestSourcePos.y - 2, roomDimensions - 3), 2),
           x2: Math.max(Math.min(closestSourcePos.x + 2, roomDimensions - 3), 2),
           y2: Math.max(Math.min(closestSourcePos.y + 2, roomDimensions - 3), 2),
      })
 }
*/
        // Get the room's stampAnchors

        const { stampAnchors } = this.communeManager.room.memory

        // Loop through types in stampAnchors

        for (const stampType in stampAnchors) {
            const stamp = stamps[stampType as StampTypes]

            // Get the protectionOffset using the stampType

            const { protectionOffset } = stamp

            // Loop through stampAnchor of this stampType's stampAnchors

            for (const packedStampAnchor of stampAnchors[stampType as StampTypes]) {
                const stampAnchor = unpackNumAsCoord(packedStampAnchor)

                // Protect the stamp

                protectionRects.push({
                    x1: Math.max(Math.min(stampAnchor.x - protectionOffset, roomDimensions - 3), 2),
                    y1: Math.max(Math.min(stampAnchor.y - protectionOffset, roomDimensions - 3), 2),
                    x2: Math.max(
                        Math.min(stampAnchor.x + protectionOffset + (stamp.asymmetry || 0), roomDimensions - 3),
                        2,
                    ),
                    y2: Math.max(
                        Math.min(stampAnchor.y + protectionOffset + (stamp.asymmetry || 0), roomDimensions - 3),
                        2,
                    ),
                })
            }
        }

        return protectionRects
    }

    private groupRamparts(rampartPositions: number[]) {
        // Construct a costMatrix to store visited positions

        const visitedCoords = new Uint8Array(2500)

        const groupedPositions = []
        let groupIndex = 0

        // Loop through each pos of positions

        for (const packedPos of rampartPositions) {
            const pos = unpackNumAsCoord(packedPos)

            // If the pos has already been visited, iterate

            if (visitedCoords[packAsNum(pos)] === 1) continue

            // Record that this pos has been visited

            visitedCoords[packAsNum(pos)] = 1

            // Construct the group for this index with the pos in it the group

            groupedPositions[groupIndex] = [new RoomPosition(pos.x, pos.y, this.communeManager.room.name)]

            // Construct values for floodFilling

            let thisGeneration = [pos]
            let nextGeneration: Coord[] = []
            let groupSize = 0

            // So long as there are positions in this gen

            while (thisGeneration.length) {
                // Reset next gen

                nextGeneration = []

                // Iterate through positions of this gen

                for (const pos of thisGeneration) {
                    // Construct a rect and get the positions in a range of 1 (not diagonals)

                    const adjacentPositions = findCoordsInsideRect(pos.x - 1, pos.y - 1, pos.x + 1, pos.y + 1)

                    // Loop through adjacent positions

                    for (const adjacentPos of adjacentPositions) {
                        // Iterate if adjacentPos is out of room bounds

                        if (
                            adjacentPos.x <= 0 ||
                            adjacentPos.x >= roomDimensions ||
                            adjacentPos.y <= 0 ||
                            adjacentPos.y >= roomDimensions
                        )
                            continue

                        const packedAdjacentCoord = packAsNum(adjacentPos)

                        // Iterate if the adjacent pos has been visited or isn't a tile

                        if (visitedCoords[packedAdjacentCoord] === 1) continue

                        // Otherwise record that it has been visited

                        visitedCoords[packedAdjacentCoord] = 1

                        // If a rampart is not planned for this position, iterate

                        if (this.communeManager.room.rampartCoords[packAsNum(adjacentPos)] !== 1) continue

                        // Add it to the next gen and this group

                        groupedPositions[groupIndex].push(
                            new RoomPosition(adjacentPos.x, adjacentPos.y, this.communeManager.room.name),
                        )

                        groupSize += 1
                        nextGeneration.push(adjacentPos)
                    }
                }

                if (groupSize >= maxRampartGroupSize) break

                // Set this gen to next gen

                thisGeneration = nextGeneration
            }

            // Increase the groupIndex

            groupIndex += 1
        }

        // Inform groupedPositions

        return groupedPositions
    }

    private generateRampartPaths(groupedRampartPositions: RoomPosition[][]) {
        this.communeManager.room.findUnprotectedCoords()

        // Get the hubAnchor

        const hubAnchor = unpackNumAsPos(this.communeManager.room.memory.stampAnchors.hub[0], this.communeManager.room.name)

        const onboardingRampartCoords = new Uint8Array(2500)

        // Loop through each group

        for (const group of groupedRampartPositions) {
            // Get the closest pos of the group by range to the anchor

            const closestPosToAnchor = group.sort((a, b) => {
                return (
                    this.communeManager.room.advancedFindPath({
                        origin: a,
                        goals: [{ pos: hubAnchor, range: 3 }],
                        weightCoordMaps: [this.communeManager.room.unprotectedCoords, this.communeManager.room.roadCoords],
                    }).length -
                    this.communeManager.room.advancedFindPath({
                        origin: b,
                        goals: [{ pos: hubAnchor, range: 3 }],
                        weightCoordMaps: [this.communeManager.room.unprotectedCoords, this.communeManager.room.roadCoords],
                    }).length
                )
            })[0]

            // Path from the hubAnchor to the cloestPosToAnchor

            const path = this.communeManager.room.advancedFindPath({
                origin: closestPosToAnchor,
                goals: [{ pos: hubAnchor, range: 2 }],
                weightCoordMaps: [this.communeManager.room.unprotectedCoords, this.communeManager.room.roadCoords],
                plainCost: defaultRoadPlanningPlainCost,
            })

            // Loop through positions of the path

            for (const pos of path) this.communeManager.room.roadCoords[packAsNum(pos)] = 1

            // Construct the onboardingIndex

            let onboardingIndex = 0
            let onboardingCount = 0

            // So long as there is a pos in path with an index of onboardingIndex

            while (path[onboardingIndex]) {
                // Get the pos in path with an index of onboardingIndex

                const packedPos = packAsNum(path[onboardingIndex])

                onboardingIndex += 1

                // If there are already rampart plans at this pos

                if (this.communeManager.room.rampartCoords[packedPos] === 1 && onboardingRampartCoords[packedPos] === 0) continue

                // Record the pos in roadCM

                this.communeManager.room.roadCoords[packedPos] = 1
                this.communeManager.room.rampartCoords[packedPos] = 1
                onboardingRampartCoords[packedPos] = 1

                onboardingCount += 1
                if (onboardingCount === minOnboardingRamparts) break
            }
        }
    }
}

export function rampartPlanner(room: Room) {
    if (room.memory.stampAnchors.rampart.length) return false

    /*
    - Posted 10 may 2018 by @saruss
    - Formatted, optimized, added readability, and modified for typescript by Carson Burke
    - Code for calculating the minCut in a room, written by Saruss
    - some readability added by Chobobobo for typescript
    - Fixed Game.map.getTerrainAt to Game.map.getRoomTerrain method -Shibdib
    */

    /**
     * An Array with Terrain information: -1 not usable, 2 Sink (Leads to Exit)
     */
    function generadeRoomMatrix() {
        /**
         * Creates an array where tileCoords[x][y] = value
         */
        room.tileCoords = new Uint8Array(2500)

        const terrainCoords = internationalManager.getTerrainCoords(room.name)

        for (let x = 0; x < roomDimensions; x += 1) {
            for (let y = 0; y < roomDimensions; y += 1) {
                const packedCoord = packXYAsNum(x, y)

                room.tileCoords[packedCoord] = UNWALKABLE

                if (terrainCoords[packXYAsNum(x, y)] === 255) continue

                room.tileCoords[packedCoord] = NORMAL

                if (x === 0 || y === 0 || x === roomDimensions - 1 || y === roomDimensions - 1)
                    room.tileCoords[packedCoord] = EXIT
            }
        }

        // Marks tiles Near Exits for sink- where you cannot build wall/rampart

        let y = 1

        for (; y < roomDimensions - 1; y += 1) {
            if (room.tileCoords[packXYAsNum(0, y - 1)] === EXIT) room.tileCoords[packXYAsNum(1, y)] = TO_EXIT
            if (room.tileCoords[packXYAsNum(0, y)] === EXIT) room.tileCoords[packXYAsNum(1, y)] = TO_EXIT
            if (room.tileCoords[packXYAsNum(0, y + 1)] === EXIT) room.tileCoords[packXYAsNum(1, y)] = TO_EXIT

            if (room.tileCoords[packXYAsNum(roomDimensions - 1, y - 1)] === EXIT)
                room.tileCoords[packXYAsNum(roomDimensions - 2, y)] = TO_EXIT
            if (room.tileCoords[packXYAsNum(roomDimensions - 1, y)] === EXIT)
                room.tileCoords[packXYAsNum(roomDimensions - 2, y)] = TO_EXIT
            if (room.tileCoords[packXYAsNum(roomDimensions - 1, y + 1)] === EXIT)
                room.tileCoords[packXYAsNum(roomDimensions - 2, y)] = TO_EXIT
        }

        let x = 1

        for (; x < roomDimensions - 1; x += 1) {
            if (room.tileCoords[packXYAsNum(x - 1, 0)] === EXIT) room.tileCoords[packXYAsNum(x, 1)] = TO_EXIT
            if (room.tileCoords[packXYAsNum(x, 0)] === EXIT) room.tileCoords[packXYAsNum(x, 1)] = TO_EXIT
            if (room.tileCoords[packXYAsNum(x + 1, 0)] === EXIT) room.tileCoords[packXYAsNum(x, 1)] = TO_EXIT

            if (room.tileCoords[packXYAsNum(x - 1, roomDimensions - 1)] === EXIT)
                room.tileCoords[packXYAsNum(x, roomDimensions - 2)] = TO_EXIT
            if (room.tileCoords[packXYAsNum(x, roomDimensions - 1)] === EXIT)
                room.tileCoords[packXYAsNum(x, roomDimensions - 2)] = TO_EXIT
            if (room.tileCoords[packXYAsNum(x + 1, roomDimensions - 1)] === EXIT)
                room.tileCoords[packXYAsNum(x, roomDimensions - 2)] = TO_EXIT
        }

        // mark Border Tiles as not usable

        y = 1

        for (; y < roomDimensions - 1; y += 1) {
            room.tileCoords[packXYAsNum(0, y)] === UNWALKABLE
            room.tileCoords[packXYAsNum(roomDimensions - 1, y)] === UNWALKABLE
        }

        x = 1

        for (; x < roomDimensions - 1; x += 1) {
            room.tileCoords[packXYAsNum(x, 0)] === UNWALKABLE
            room.tileCoords[packXYAsNum(x, roomDimensions - 1)] === UNWALKABLE
        }
    }

    interface Graph {
        level: any[]
        v: number
        edges: any

        // Functions

        New_edge(u: number, v: number, c: number): void

        Bfs(s: number, t: number): boolean

        Dfsflow(u: number, f: number, t: number, c: any[]): number

        Bfsthecut(s: number): any[]

        Calcmincut(s: number, t: number): number
    }

    class Graph {
        constructor(menge_v: number) {
            // Vertex count

            this.v = menge_v
            this.level = Array(menge_v)

            // Array: for every vertex an edge Array mit {v,r,c,f} vertex_to,res_edge,capacity,flow

            this.edges = Array(menge_v)
                .fill(0)
                .map(x => [])
        }
    }

    // Adds new edge from u to v

    Graph.prototype.New_edge = function (u, v, c) {
        this.edges[u].push({ v, r: this.edges[v].length, c, f: 0 }) // Normal forward Edge
        this.edges[v].push({ v: u, r: this.edges[u].length - 1, c: 0, f: 0 }) // reverse Edge for Residal Graph
    }

    Graph.prototype.Bfs = function (s, t) {
        // calculates Level Graph and if theres a path from s to t

        if (t >= this.v) return false

        this.level.fill(-1) // reset old levels
        this.level[s] = 0
        const q = [] // queue with s as starting point

        q.push(s)

        let u = 0
        let edge = null

        while (q.length) {
            u = q.splice(0, 1)[0]
            let i = 0
            const imax = this.edges[u].length

            for (; i < imax; i += 1) {
                edge = this.edges[u][i]

                if (this.level[edge.v] < 0 && edge.f < edge.c) {
                    this.level[edge.v] = this.level[u] + 1
                    q.push(edge.v)
                }
            }
        }
        return this.level[t] >= 0 // return if theres a path to t -> no level, no path!
    }

    // DFS like: send flow at along path from s->t recursivly while increasing the level of the visited vertices by one
    // u vertex, f flow on path, t =Sink , c Array, c[i] saves the count of edges explored from vertex i

    Graph.prototype.Dfsflow = function (u, f, t, c) {
        // Sink reached, abort recursion

        if (u === t) return f

        let edge = null
        let flow_till_here = 0
        let flow_to_t = 0

        while (c[u] < this.edges[u].length) {
            // Visit all edges of the vertex  one after the other

            edge = this.edges[u][c[u]]

            if (this.level[edge.v] === this.level[u] + 1 && edge.f < edge.c) {
                // Edge leads to Vertex with a level one higher, and has flow left

                flow_till_here = Math.min(f, edge.c - edge.f)
                flow_to_t = this.Dfsflow(edge.v, flow_till_here, t, c)

                if (flow_to_t > 0) {
                    edge.f += flow_to_t // Add Flow to current edge
                    this.edges[edge.v][edge.r].f -= flow_to_t // subtract from reverse Edge -> Residual Graph neg. Flow to use backward direction of BFS/DFS
                    return flow_to_t
                }
            }
            c[u] += 1
        }
        return 0
    }

    // breadth-first-search which uses the level array to mark the vertices reachable from s

    Graph.prototype.Bfsthecut = function (s) {
        const e_in_cut = []
        this.level.fill(-1)
        this.level[s] = 1
        const q = []

        q.push(s)

        let u = 0
        let edge = null

        while (q.length) {
            u = q.splice(0, 1)[0]
            let i = 0
            const imax = this.edges[u].length

            for (; i < imax; i += 1) {
                edge = this.edges[u][i]

                if (edge.f < edge.c) {
                    if (this.level[edge.v] < 1) {
                        this.level[edge.v] = 1
                        q.push(edge.v)
                    }
                }
                if (edge.f === edge.c && edge.c > 0) {
                    // blocking edge -> could be in min cut
                    edge.u = u
                    e_in_cut.push(edge)
                }
            }
        }

        const min_cut = []
        let i = 0
        const imax = e_in_cut.length

        for (; i < imax; i += 1) {
            // Only edges which are blocking and lead to from s unreachable vertices are in the min cut

            if (this.level[e_in_cut[i].v] === -1) min_cut.push(e_in_cut[i].u)
        }
        return min_cut
    }

    // Calculates a mincut graph (Dinic Algorithm)

    Graph.prototype.Calcmincut = function (s, t) {
        if (s === t) return -1

        let returnValue = 0

        while (this.Bfs(s, t) === true) {
            const count = Array(this.v + 1).fill(0)
            let flow = 0

            do {
                flow = this.Dfsflow(s, Number.MAX_VALUE, t, count)
                if (flow > 0) returnValue += flow
            } while (flow)
        }

        return returnValue
    }

    // Function to create Source, Sink, Tiles arrays: takes a rectangle-Array as input for Tiles that are to Protect

    function createGraph(rects: Rect[]) {
        generadeRoomMatrix()

        // Loop through each rect

        for (const rect of rects) {
            // Loop through each pos inside the rect

            for (let x = rect.x1; x <= rect.x2; x += 1) {
                for (let y = rect.y1; y <= rect.y2; y += 1) {
                    // If the pos is NORMAL and on the edge of the rect

                    if (x === rect.x1 || x === rect.x2 || y === rect.y1 || y === rect.y2) {
                        // Set the pos to protected, and iterate

                        if (room.tileCoords[packXYAsNum(x, y)] === NORMAL)
                            room.tileCoords[packXYAsNum(x, y)] = PROTECTED
                        continue
                    }

                    // Otherwise set the pos as unwalkable

                    room.tileCoords[packXYAsNum(x, y)] = UNWALKABLE
                }
            }
        }
        /*
        if (Memory.baseVisuals) {
            // Visualize position values
            for (let x = 0; x < roomDimensions; x += 1) {
                for (let y = 0; y < roomDimensions; y += 1) {
                    const tileType = room.tileCoords[packXYAsNum(x, y)]
                    if (tileType === NORMAL) {
                        room.visual.rect(x - 0.5, y - 0.5, 1, 1, {
                            fill: customColors.yellow,
                            opacity: 0.3,
                        })
                        continue
                    }
                    if (tileType === PROTECTED) {
                        room.visual.rect(x - 0.5, y - 0.5, 1, 1, {
                            fill: customColors.green,
                            opacity: 0.3,
                        })
                        continue
                    }
                    if (tileType === UNWALKABLE) {
                        room.visual.rect(x - 0.5, y - 0.5, 1, 1, {
                            fill: customColors.red,
                            opacity: 0.3,
                        })
                        continue
                    }
                }
            }
        }
 */
        // initialise graph
        // possible 2*50*50 +2 (st) Vertices (Walls etc set to unused later)

        const g = new Graph(2 * 50 * 50 + 2)
        const infini = Number.MAX_VALUE
        const surr = [
            [0, -1],
            [-1, -1],
            [-1, 0],
            [-1, 1],
            [0, 1],
            [1, 1],
            [1, 0],
            [1, -1],
        ]
        // per Tile (0 in Array) top + bot with edge of c=1 from top to bott  (use every tile once!)
        // infini edge from bot to top vertices of adjacent tiles if they not protected (array =1) (no reverse edges in normal graph)
        // per prot. Tile (1 in array) Edge from source to this tile with infini cap.
        // per exit Tile (2in array) Edge to sink with infini cap.
        // source is at  pos 2*50*50, sink at 2*50*50+1 as first tile is 0,0 => pos 0
        // top vertices <-> x,y : v=y*50+x   and x= v % 50  y=v/50 (math.floor?)
        // bot vertices <-> top + 2500

        const source = 2 * 50 * 50
        const sink = 2 * 50 * 50 + 1

        let dx = 0
        let dy = 0

        for (let x = 1; x < roomDimensions - 1; x += 1) {
            for (let y = 1; y < roomDimensions - 1; y += 1) {
                const top = y * 50 + x
                const bot = top + 2500

                if (room.tileCoords[packXYAsNum(x, y)] === NORMAL) {
                    // normal Tile
                    g.New_edge(top, bot, 1)

                    for (let i = 0; i < 8; i += 1) {
                        dx = x + surr[i][0]
                        dy = y + surr[i][1]

                        if (
                            room.tileCoords[packXYAsNum(dx, dy)] === NORMAL ||
                            room.tileCoords[packXYAsNum(dx, dy)] === TO_EXIT
                        )
                            g.New_edge(bot, dy * 50 + dx, infini)
                    }

                    continue
                }

                if (room.tileCoords[packXYAsNum(x, y)] === PROTECTED) {
                    // protected Tile
                    g.New_edge(source, top, infini)
                    g.New_edge(top, bot, 1)

                    for (let i = 0; i < 8; i += 1) {
                        dx = x + surr[i][0]
                        dy = y + surr[i][1]

                        if (
                            room.tileCoords[packXYAsNum(dx, dy)] === NORMAL ||
                            room.tileCoords[packXYAsNum(dx, dy)] === TO_EXIT
                        )
                            g.New_edge(bot, dy * 50 + dx, infini)
                    }

                    continue
                }

                if (room.tileCoords[packXYAsNum(x, y)] === TO_EXIT) {
                    // near Exit
                    g.New_edge(top, sink, infini)
                    continue
                }
            }
        }

        // graph finished
        return g
    }

    // Removes unneccary cut-tiles if bounds are set to include some 	dead ends

    function deleteTilesToDeadEnds(cutCoords: Coord[]) {
        for (let i = cutCoords.length - 1; i >= 0; i -= 1)
            room.tileCoords[packXYAsNum(cutCoords[i].x, cutCoords[i].y)] = UNWALKABLE

        // Floodfill from exits: save exit tiles in array and do a bfs-like search

        const unvisited_pos = []
        let y = 0

        for (; y < roomDimensions - 1; y += 1) {
            if (room.tileCoords[packXYAsNum(1, y)] === TO_EXIT) unvisited_pos.push(50 * y + 1)
            if (room.tileCoords[packXYAsNum(48, y)] === TO_EXIT) unvisited_pos.push(50 * y + 48)
        }

        let x = 0

        for (; x < roomDimensions - 1; x += 1) {
            if (room.tileCoords[packXYAsNum(x, 1)] === TO_EXIT) unvisited_pos.push(50 + x)
            if (room.tileCoords[packXYAsNum(x, 48)] === TO_EXIT) unvisited_pos.push(2400 + x) // 50*48=2400
        }

        // Iterate over all unvisited TO_EXIT- Tiles and mark neigbours as TO_EXIT tiles, if walkable (NORMAL), and add to unvisited

        const surr = [
            [0, -1],
            [-1, -1],
            [-1, 0],
            [-1, 1],
            [0, 1],
            [1, 1],
            [1, 0],
            [1, -1],
        ]
        let index
        let dx
        let dy

        while (unvisited_pos.length > 0) {
            index = unvisited_pos.pop()
            x = index % 50
            y = Math.floor(index / 50)

            for (let i = 0; i < 8; i += 1) {
                dx = x + surr[i][0]
                dy = y + surr[i][1]

                if (room.tileCoords[packXYAsNum(dx, dy)] === NORMAL) {
                    unvisited_pos.push(50 * dy + dx)
                    room.tileCoords[packXYAsNum(dx, dy)] = TO_EXIT
                }
            }
        }

        // Remove min-Cut-Tile if there is no TO-EXIT  surrounding it
        let leads_to_exit = false

        for (let i = cutCoords.length - 1; i >= 0; i -= 1) {
            leads_to_exit = false
            x = cutCoords[i].x
            y = cutCoords[i].y

            for (let i = 0; i < 8; i += 1) {
                dx = x + surr[i][0]
                dy = y + surr[i][1]

                if (room.tileCoords[packXYAsNum(dx, dy)] === TO_EXIT) {
                    leads_to_exit = true
                }
            }

            if (!leads_to_exit) cutCoords.splice(i, 1)
        }
    }

    // Function for user: calculate min cut tiles from room, rect[]

    function GetCutTiles(rects: Rect[]) {
        const graph = createGraph(rects)
        if (!graph) return []

        // Position Source / Sink in Room-Graph

        const source = 2 * 50 * 50

        const sink = 2 * 50 * 50 + 1

        const positions: Coord[] = []
        const packedPositions: number[] = []

        if (graph.Calcmincut(source, sink) > 0) {
            const cutEdges = graph.Bfsthecut(source)

            // Get Positions from Edge

            for (let i = 0; i < cutEdges.length; i += 1) {
                const packedCoord = cutEdges[i] // x= v % 50  y=v/50 (math.floor?)
                const x = packedCoord % 50
                const y = Math.floor(packedCoord / 50)

                positions.push({ x, y })
                packedPositions.push(packAsNum({ x, y }))
            }
        }

        // if bounds are given,
        // try to dectect islands of walkable tiles, which are not conntected to the exits, and delete them from the cut-tiles

        if (positions.length > 0) deleteTilesToDeadEnds(positions)

        return packedPositions
    }

    // Rectangle Array, the Rectangles will be protected by the returned tiles

    const protectionRects: Rect[] = []

    // Get the controller

    const { controller } = room

    // Protect it

    protectionRects.push({
        x1: Math.max(Math.min(controller.pos.x - 1, roomDimensions - 3), 2),
        y1: Math.max(Math.min(controller.pos.y - 1, roomDimensions - 3), 2),
        x2: Math.max(Math.min(controller.pos.x + 1, roomDimensions - 3), 2),
        y2: Math.max(Math.min(controller.pos.y + 1, roomDimensions - 3), 2),
    })

    // Get the centerUpgradePos

    const centerUpgradePos = room.centerUpgradePos
    if (!centerUpgradePos) return false

    // Protect it

    protectionRects.push({
        x1: Math.max(Math.min(centerUpgradePos.x - 3, roomDimensions - 3), 2),
        y1: Math.max(Math.min(centerUpgradePos.y - 3, roomDimensions - 3), 2),
        x2: Math.max(Math.min(centerUpgradePos.x + 3, roomDimensions - 3), 2),
        y2: Math.max(Math.min(centerUpgradePos.y + 3, roomDimensions - 3), 2),
    })

    /*
     let closestSourcePos = room.sourcePositions[0][0]
     // Protect it
     protectionRects.push({
          x1: Math.max(Math.min(closestSourcePos.x - 2, roomDimensions - 3), 2),
          y1: Math.max(Math.min(closestSourcePos.y - 2, roomDimensions - 3), 2),
          x2: Math.max(Math.min(closestSourcePos.x + 2, roomDimensions - 3), 2),
          y2: Math.max(Math.min(closestSourcePos.y + 2, roomDimensions - 3), 2),
     })
     closestSourcePos = room.sourcePositions[1][0]
     if (closestSourcePos) {
          // Protect it
          protectionRects.push({
               x1: Math.max(Math.min(closestSourcePos.x - 2, roomDimensions - 3), 2),
               y1: Math.max(Math.min(closestSourcePos.y - 2, roomDimensions - 3), 2),
               x2: Math.max(Math.min(closestSourcePos.x + 2, roomDimensions - 3), 2),
               y2: Math.max(Math.min(closestSourcePos.y + 2, roomDimensions - 3), 2),
          })
     }
 */
    // Get the room's stampAnchors

    const { stampAnchors } = room.memory

    // Loop through types in stampAnchors

    for (const stampType in stampAnchors) {
        const stamp = stamps[stampType as StampTypes]

        // Get the protectionOffset using the stampType

        const { protectionOffset } = stamp

        // Loop through stampAnchor of this stampType's stampAnchors

        for (const packedStampAnchor of stampAnchors[stampType as StampTypes]) {
            const stampAnchor = unpackNumAsCoord(packedStampAnchor)

            // Protect the stamp

            protectionRects.push({
                x1: Math.max(Math.min(stampAnchor.x - protectionOffset, roomDimensions - 3), 2),
                y1: Math.max(Math.min(stampAnchor.y - protectionOffset, roomDimensions - 3), 2),
                x2: Math.max(
                    Math.min(stampAnchor.x + protectionOffset + (stamp.asymmetry || 0), roomDimensions - 3),
                    2,
                ),
                y2: Math.max(
                    Math.min(stampAnchor.y + protectionOffset + (stamp.asymmetry || 0), roomDimensions - 3),
                    2,
                ),
            })
        }
    }

    // Get Min cut
    // Positions is an array where to build walls/ramparts

    const rampartPositions = GetCutTiles(protectionRects)

    // Plan the positions

    for (const packedPos of rampartPositions) {
        const pos = unpackNumAsCoord(packedPos)

        // Record the pos

        room.roadCoords[packAsNum(pos)] = 1
        room.rampartCoords[packAsNum(pos)] = 1
    }

    room.findUnprotectedCoords()

    // Get the hubAnchor

    const hubAnchor = unpackNumAsPos(room.memory.stampAnchors.hub[0], room.name)

    const onboardingRampartCoords = new Uint8Array(2500)

    // Group rampart positions

    const groupedRampartPositions = room.groupRampartPositions(rampartPositions)

    // Loop through each group

    for (const group of groupedRampartPositions) {
        // Get the closest pos of the sort by range to the anchor

        const closestPosToAnchor = group.sort((a, b) => {
            return (
                room.advancedFindPath({
                    origin: a,
                    goals: [{ pos: hubAnchor, range: 3 }],
                    weightCoordMaps: [room.unprotectedCoords, room.roadCoords],
                }).length -
                room.advancedFindPath({
                    origin: b,
                    goals: [{ pos: hubAnchor, range: 3 }],
                    weightCoordMaps: [room.unprotectedCoords, room.roadCoords],
                }).length
            )
        })[0]

        // Path from the hubAnchor to the cloestPosToAnchor

        const path = room.advancedFindPath({
            origin: closestPosToAnchor,
            goals: [{ pos: hubAnchor, range: 2 }],
            weightCoordMaps: [room.unprotectedCoords, room.roadCoords],
            plainCost: defaultRoadPlanningPlainCost,
        })

        // Loop through positions of the path

        for (const pos of path) room.roadCoords[packAsNum(pos)] = 1

        // Construct the onboardingIndex

        let onboardingIndex = 0
        let onboardingCount = 0

        // So long as there is a pos in path with an index of onboardingIndex

        while (path[onboardingIndex]) {
            // Get the pos in path with an index of onboardingIndex

            const packedPos = packAsNum(path[onboardingIndex])

            onboardingIndex += 1

            // If there are already rampart plans at this pos

            if (room.rampartCoords[packedPos] === 1 && onboardingRampartCoords[packedPos] === 0) continue

            // Record the pos in roadCM

            room.roadCoords[packedPos] = 1
            room.rampartCoords[packedPos] = 1
            onboardingRampartCoords[packedPos] = 1

            onboardingCount += 1
            if (onboardingCount === minOnboardingRamparts) break
        }
    }

    return true
}
