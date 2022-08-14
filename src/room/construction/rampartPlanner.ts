import {
    EXIT,
    minOnboardingRamparts,
    myColors,
    NORMAL,
    PROTECTED,
    roomDimensions,
    stamps,
    TO_EXIT,
    UNWALKABLE,
} from 'international/constants'
import { createPosMap, customLog, pack, packXY, unpackAsPos, unpackAsRoomPos } from 'international/generalFunctions'
import { internationalManager } from 'international/internationalManager'

export function rampartPlanner(room: Room) {
    if (room.memory.stampAnchors.rampart.length) return false

    // require('util.min_cut').test('W5N9');

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
                const packedCoord = packXY(x, y)

                room.tileCoords[packedCoord] = UNWALKABLE

                if (terrainCoords[packXY(x, y)] === 255) continue

                room.tileCoords[packedCoord] = NORMAL

                if (x === 0 || y === 0 || x === roomDimensions - 1 || y === roomDimensions - 1)
                    room.tileCoords[packedCoord] = EXIT
            }
        }

        // Marks tiles Near Exits for sink- where you cannot build wall/rampart

        let y = 1

        for (; y < roomDimensions - 1; y += 1) {
            if (room.tileCoords[packXY(0, y - 1)] === EXIT) room.tileCoords[packXY(1, y)] = TO_EXIT
            if (room.tileCoords[packXY(0, y)] === EXIT) room.tileCoords[packXY(1, y)] = TO_EXIT
            if (room.tileCoords[packXY(0, y + 1)] === EXIT) room.tileCoords[packXY(1, y)] = TO_EXIT

            if (room.tileCoords[packXY(roomDimensions - 1, y - 1)] === EXIT)
                room.tileCoords[packXY(roomDimensions - 2, y)] = TO_EXIT
            if (room.tileCoords[packXY(roomDimensions - 1, y)] === EXIT)
                room.tileCoords[packXY(roomDimensions - 2, y)] = TO_EXIT
            if (room.tileCoords[packXY(roomDimensions - 1, y + 1)] === EXIT)
                room.tileCoords[packXY(roomDimensions - 2, y)] = TO_EXIT
        }

        let x = 1

        for (; x < roomDimensions - 1; x += 1) {
            if (room.tileCoords[packXY(x - 1, 0)] === EXIT) room.tileCoords[packXY(x, 1)] = TO_EXIT
            if (room.tileCoords[packXY(x, 0)] === EXIT) room.tileCoords[packXY(x, 1)] = TO_EXIT
            if (room.tileCoords[packXY(x + 1, 0)] === EXIT) room.tileCoords[packXY(x, 1)] = TO_EXIT

            if (room.tileCoords[packXY(x - 1, roomDimensions - 1)] === EXIT)
                room.tileCoords[packXY(x, roomDimensions - 2)] = TO_EXIT
            if (room.tileCoords[packXY(x, roomDimensions - 1)] === EXIT)
                room.tileCoords[packXY(x, roomDimensions - 2)] = TO_EXIT
            if (room.tileCoords[packXY(x + 1, roomDimensions - 1)] === EXIT)
                room.tileCoords[packXY(x, roomDimensions - 2)] = TO_EXIT
        }

        // mark Border Tiles as not usable

        y = 1

        for (; y < roomDimensions - 1; y += 1) {
            room.tileCoords[packXY(0, y)] === UNWALKABLE
            room.tileCoords[packXY(roomDimensions - 1, y)] === UNWALKABLE
        }

        x = 1

        for (; x < roomDimensions - 1; x += 1) {
            room.tileCoords[packXY(x, 0)] === UNWALKABLE
            room.tileCoords[packXY(x, roomDimensions - 1)] === UNWALKABLE
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

                        if (room.tileCoords[packXY(x, y)] === NORMAL) room.tileCoords[packXY(x, y)] = PROTECTED
                        continue
                    }

                    // Otherwise set the pos as unwalkable

                    room.tileCoords[packXY(x, y)] = UNWALKABLE
                }
            }
        }

        // If roomVisuals are enabled

        if (Memory.baseVisuals) {
            // Visualize position values

            for (let x = 0; x < roomDimensions; x += 1) {
                for (let y = 0; y < roomDimensions; y += 1) {
                    const tileType = room.tileCoords[packXY(x, y)]

                    if (tileType === NORMAL) {
                        room.visual.rect(x - 0.5, y - 0.5, 1, 1, {
                            fill: myColors.yellow,
                            opacity: 0.3,
                        })
                        continue
                    }

                    if (tileType === PROTECTED) {
                        room.visual.rect(x - 0.5, y - 0.5, 1, 1, {
                            fill: myColors.green,
                            opacity: 0.3,
                        })
                        continue
                    }

                    if (tileType === UNWALKABLE) {
                        room.visual.rect(x - 0.5, y - 0.5, 1, 1, {
                            fill: myColors.red,
                            opacity: 0.3,
                        })
                        continue
                    }
                }
            }
        }

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

                if (room.tileCoords[packXY(x, y)] === NORMAL) {
                    // normal Tile
                    g.New_edge(top, bot, 1)

                    for (let i = 0; i < 8; i += 1) {
                        dx = x + surr[i][0]
                        dy = y + surr[i][1]

                        if (room.tileCoords[packXY(dx, dy)] === NORMAL || room.tileCoords[packXY(dx, dy)] === TO_EXIT)
                            g.New_edge(bot, dy * 50 + dx, infini)
                    }

                    continue
                }

                if (room.tileCoords[packXY(x, y)] === PROTECTED) {
                    // protected Tile
                    g.New_edge(source, top, infini)
                    g.New_edge(top, bot, 1)

                    for (let i = 0; i < 8; i += 1) {
                        dx = x + surr[i][0]
                        dy = y + surr[i][1]

                        if (room.tileCoords[packXY(dx, dy)] === NORMAL || room.tileCoords[packXY(dx, dy)] === TO_EXIT)
                            g.New_edge(bot, dy * 50 + dx, infini)
                    }

                    continue
                }

                if (room.tileCoords[packXY(x, y)] === TO_EXIT) {
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
            room.tileCoords[packXY(cutCoords[i].x, cutCoords[i].y)] = UNWALKABLE

        // Floodfill from exits: save exit tiles in array and do a bfs-like search

        const unvisited_pos = []
        let y = 0

        for (; y < roomDimensions - 1; y += 1) {
            if (room.tileCoords[packXY(1, y)] === TO_EXIT) unvisited_pos.push(50 * y + 1)
            if (room.tileCoords[packXY(48, y)] === TO_EXIT) unvisited_pos.push(50 * y + 48)
        }

        let x = 0

        for (; x < roomDimensions - 1; x += 1) {
            if (room.tileCoords[packXY(x, 1)] === TO_EXIT) unvisited_pos.push(50 + x)
            if (room.tileCoords[packXY(x, 48)] === TO_EXIT) unvisited_pos.push(2400 + x) // 50*48=2400
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

                if (room.tileCoords[packXY(dx, dy)] === NORMAL) {
                    unvisited_pos.push(50 * dy + dx)
                    room.tileCoords[packXY(dx, dy)] = TO_EXIT
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

                if (room.tileCoords[packXY(dx, dy)] === TO_EXIT) {
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
                packedPositions.push(pack({ x, y }))
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

    const centerUpgradePos: RoomPosition = room.get('centerUpgradePos')

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
        // Get the protectionOffset using the stampType

        const { protectionOffset } = stamps[stampType as StampTypes]

        // Loop through stampAnchor of this stampType's stampAnchors

        for (const packedStampAnchor of stampAnchors[stampType as StampTypes]) {
            const stampAnchor = unpackAsPos(packedStampAnchor)

            // Protect the stamp

            protectionRects.push({
                x1: Math.max(Math.min(stampAnchor.x - protectionOffset, roomDimensions - 3), 2),
                y1: Math.max(Math.min(stampAnchor.y - protectionOffset, roomDimensions - 3), 2),
                x2: Math.max(Math.min(stampAnchor.x + protectionOffset, roomDimensions - 3), 2),
                y2: Math.max(Math.min(stampAnchor.y + protectionOffset, roomDimensions - 3), 2),
            })
        }
    }

    // Get Min cut
    // Positions is an array where to build walls/ramparts

    const rampartPositions = GetCutTiles(protectionRects)

    // Plan the positions

    for (const packedPos of rampartPositions) {
        const pos = unpackAsPos(packedPos)

        // Record the pos

        room.roadCoords[pack(pos)] = 1
        room.rampartCoords[pack(pos)] = 1
    }

    room.findUnprotectedCoords()

    // Get the hubAnchor

    const hubAnchor = unpackAsRoomPos(room.memory.stampAnchors.hub[0], room.name)

    const onboardingRampartCoords = new Uint8Array(2500)

    // Group rampart positions

    const groupedRampartPositions = room.groupRampartPositions(rampartPositions)

    // Loop through each group

    for (const group of groupedRampartPositions) {
        // Get the closest pos of the group by range to the anchor

        const closestPosToAnchor = group.sort((a, b) => {
            return (
                room.advancedFindPath({
                    origin: a,
                    goal: { pos: hubAnchor, range: 3 },
                    weightCoordMaps: [room.roadCoords, room.unprotectedCoords],
                }).length -
                room.advancedFindPath({
                    origin: b,
                    goal: { pos: hubAnchor, range: 3 },
                    weightCoordMaps: [room.roadCoords, room.unprotectedCoords],
                }).length
            )
        })[0]

        // Path from the hubAnchor to the cloestPosToAnchor

        const path = room.advancedFindPath({
            origin: closestPosToAnchor,
            goal: { pos: hubAnchor, range: 2 },
            weightCoordMaps: [room.roadCoords, room.unprotectedCoords],
        })

        // Loop through positions of the path

        for (const pos of path) room.roadCoords[pack(pos)] = 1

        // Construct the onboardingIndex

        let onboardingIndex = 0
        let onboardingCount = 0

        // So long as there is a pos in path with an index of onboardingIndex

        while (path[onboardingIndex]) {
            // Get the pos in path with an index of onboardingIndex

            const packedPos = pack(path[onboardingIndex])

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

    // Loop through each tower anchor and plan for a rampart at it

    for (const packedStampAnchor of stampAnchors.tower) {
        const stampAnchor = unpackAsPos(packedStampAnchor)

        room.rampartCoords[pack(stampAnchor)] = 1
    }

    // Protect fastFiller spawns

    room.rampartCoords[packXY(room.anchor.x - 2, room.anchor.y - 1)] = 1
    room.rampartCoords[packXY(room.anchor.x + 2, room.anchor.y - 1)] = 1
    room.rampartCoords[packXY(room.anchor.x, room.anchor.y + 2)] = 1

    // Protect useful hub structures

    room.rampartCoords[packXY(hubAnchor.x + 1, hubAnchor.y - 1)] = 1
    room.rampartCoords[packXY(hubAnchor.x - 1, hubAnchor.y + 1)] = 1

    // Inform true

    return true
}
