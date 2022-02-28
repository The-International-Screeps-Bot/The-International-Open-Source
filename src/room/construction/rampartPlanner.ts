import { constants } from "international/constants";

export function rampartPlanner(room: Room) {

    // require('util.min_cut').test('W5N9');

    /**
     * Posted 10 may 2018 by @saruss
     * Formatted, added readability, and modified for typescript by Carson Burke
     *
     * Code for calculating the minCut in a room, written by Saruss
     * adapted (for Typescript by Chobobobo , is it somewhere?)
     * some readability added by Chobobobo @typescript was included here
     * (15Aug2019) Updated Game.map.getTerrainAt to Game.map.getRoomTerrain method -Shibdib
     */

    const UNWALKABLE = -1;
    const NORMAL = 0;
    const PROTECTED = 1;
    const TO_EXIT = 2;
    const EXIT = 3;

    /**
     * An Array with Terrain information: -1 not usable, 2 Sink (Leads to Exit)
     */
    function room_2d_array(roomname: string, bounds = { x1: 0, y1: 0, x2: 49, y2: 49 }) {
        let room_2d = Array(50).fill(0).map(x => Array(50).fill(UNWALKABLE)); // Array for room tiles
        let i = bounds.x1;
        const imax = bounds.x2;
        let j = bounds.y1;
        const jmax = bounds.y2;
        const terrain = Game.map.getRoomTerrain(roomname);
        for (; i <= imax; i++) {
            j = bounds.y1;
            for (; j <= jmax; j++) {
                if (terrain.get(i, j) !== TERRAIN_MASK_WALL) {
                    room_2d[i][j] = NORMAL; // mark unwalkable
                    if (i === bounds.x1 || j === bounds.y1 || i === bounds.x2 || j === bounds.y2)
                        room_2d[i][j] = TO_EXIT; // Sink Tiles mark from given bounds
                    if (i === 0 || j === 0 || i === 49 || j === 49)
                        room_2d[i][j] = EXIT; // Exit Tiles mark

                }
            }
        }

        /* OLD CODE
        let terrain_array=room.lookForAtArea(LOOK_TERRAIN,0,0,49,49,true);
        if (terrain_array.length == 0) {
            console.log('get_room_array in room_layout, look-at-for-Area Fehler');
        }
        let terrain='';
        let x_pos=0;
        let y_pos=0;
        let i=0;const imax=terrain_array.length;
        for (;i<imax;i++) { // Filling array with terrain information
            terrain=terrain_array[i];
            x_pos=terrain.x;
            y_pos=terrain.y;
            if (terrain.terrain==='wall') {
                room_2d[x_pos][y_pos]=-1; // mark unwalkable
            } else {
                if (x_pos===0 || y_pos===0 ||x_pos===49 || y_pos===49)
                    room_2d[x_pos][y_pos]=3; // Exit Tiles mark
            }
        }
        ENDE OLD CODE */

        // Marks tiles Near Exits for sink- where you cannot build wall/rampart
        let y = 1;
        const max = 49;
        for (; y < max; y++) {
            if (room_2d[0][y - 1] === EXIT) room_2d[1][y] = TO_EXIT;
            if (room_2d[0][y] === EXIT) room_2d[1][y] = TO_EXIT;
            if (room_2d[0][y + 1] === EXIT) room_2d[1][y] = TO_EXIT;
            if (room_2d[49][y - 1] === EXIT) room_2d[48][y] = TO_EXIT;
            if (room_2d[49][y] === EXIT) room_2d[48][y] = TO_EXIT;
            if (room_2d[49][y + 1] === EXIT) room_2d[48][y] = TO_EXIT;
        }
        let x = 1;
        for (; x < max; x++) {
            if (room_2d[x - 1][0] === EXIT) room_2d[x][1] = TO_EXIT;
            if (room_2d[x][0] === EXIT) room_2d[x][1] = TO_EXIT;
            if (room_2d[x + 1][0] === EXIT) room_2d[x][1] = TO_EXIT;
            if (room_2d[x - 1][49] === EXIT) room_2d[x][48] = TO_EXIT;
            if (room_2d[x][49] === EXIT) room_2d[x][48] = TO_EXIT;
            if (room_2d[x + 1][49] === EXIT) room_2d[x][48] = TO_EXIT;
        }
        // mark Border Tiles as not usable
        y = 1;
        for (; y < max; y++) {
            room_2d[0][y] == UNWALKABLE;
            room_2d[49][y] == UNWALKABLE;
        }
        x = 1;
        for (; x < max; x++) {
            room_2d[x][0] == UNWALKABLE;
            room_2d[x][49] == UNWALKABLE;
        }
        return room_2d;
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

            this.v = menge_v; // Vertex count
            this.level = Array(menge_v);
            this.edges = Array(menge_v).fill(0).map(x => []); // Array: for every vertex an edge Array mit {v,r,c,f} vertex_to,res_edge,capacity,flow
        }
    }

    Graph.prototype.New_edge = function(u, v, c) { // Adds new edge from u to v
        this.edges[u].push({ v: v, r: this.edges[v].length, c: c, f: 0 }); // Normal forward Edge
        this.edges[v].push({ v: u, r: this.edges[u].length - 1, c: 0, f: 0 }); // reverse Edge for Residal Graph
    }

    Graph.prototype.Bfs = function(s, t) { // calculates Level Graph and if theres a path from s to t
        if (t >= this.v)
            return false;
        this.level.fill(-1); // reset old levels
        this.level[s] = 0;
        let q = []; // queue with s as starting point
        q.push(s);
        let u = 0;
        let edge = null;
        while (q.length) {
            u = q.splice(0, 1)[0];
            let i = 0;
            const imax = this.edges[u].length;
            for (; i < imax; i++) {
                edge = this.edges[u][i];
                if (this.level[edge.v] < 0 && edge.f < edge.c) {
                    this.level[edge.v] = this.level[u] + 1;
                    q.push(edge.v);
                }
            }
        }
        return this.level[t] >= 0; // return if theres a path to t -> no level, no path!
    }

    // DFS like: send flow at along path from s->t recursivly while increasing the level of the visited vertices by one
    // u vertex, f flow on path, t =Sink , c Array, c[i] saves the count of edges explored from vertex i

    Graph.prototype.Dfsflow = function(u, f, t, c) {
        if (u === t) // Sink reached , aboard recursion
            return f;
        let edge = null;
        let flow_till_here = 0;
        let flow_to_t = 0;
        while (c[u] < this.edges[u].length) { // Visit all edges of the vertex  one after the other
            edge = this.edges[u][c[u]];
            if (this.level[edge.v] === this.level[u] + 1 && edge.f < edge.c) { // Edge leads to Vertex with a level one higher, and has flow left
                flow_till_here = Math.min(f, edge.c - edge.f);
                flow_to_t = this.Dfsflow(edge.v, flow_till_here, t, c);
                if (flow_to_t > 0) {
                    edge.f += flow_to_t; // Add Flow to current edge
                    this.edges[edge.v][edge.r].f -= flow_to_t; // subtract from reverse Edge -> Residual Graph neg. Flow to use backward direction of BFS/DFS
                    return flow_to_t;
                }
            }
            c[u]++;
        }
        return 0;
    }

    // breadth-first-search which uses the level array to mark the vertices reachable from s

    Graph.prototype.Bfsthecut = function(s) {
        let e_in_cut = [];
        this.level.fill(-1);
        this.level[s] = 1;
        let q = [];
        q.push(s);
        let u = 0;
        let edge = null;
        while (q.length) {
            u = q.splice(0, 1)[0];
            let i = 0;
            const imax = this.edges[u].length;
            for (; i < imax; i++) {
                edge = this.edges[u][i];
                if (edge.f < edge.c) {
                    if (this.level[edge.v] < 1) {
                        this.level[edge.v] = 1;
                        q.push(edge.v);
                    }
                }
                if (edge.f === edge.c && edge.c > 0) { // blocking edge -> could be in min cut
                    edge.u = u;
                    e_in_cut.push(edge);
                }
            }
        }
        let min_cut = [];
        let i = 0;
        const imax = e_in_cut.length;
        for (; i < imax; i++) {
            if (this.level[e_in_cut[i].v] === -1) // Only edges which are blocking and lead to from s unreachable vertices are in the min cut
                min_cut.push(e_in_cut[i].u);
        }
        return min_cut;
    }

    Graph.prototype.Calcmincut = function(s, t) { // calculates min-cut graph (Dinic Algorithm)
        if (s == t)
            return -1;
        let returnvalue = 0;
        let count = [];
        let flow = 0;
        while (this.Bfs(s, t) === true) {
            count = Array(this.v + 1).fill(0);
            flow = 0;
            do {
                flow = this.Dfsflow(s, Number.MAX_VALUE, t, count);
                if (flow > 0)
                    returnvalue += flow;
            } while (flow)
        }
        return returnvalue;
    }

    // Function to create Source, Sink, Tiles arrays: takes a rectangle-Array as input for Tiles that are to Protect
    // rects have top-left/bot_right Coordinates {x1,y1,x2,y2}

    function create_graph(roomname: string, rect: any, bounds: Rect) {
        let room_array = room_2d_array(roomname, bounds); // An Array with Terrain information: -1 not usable, 2 Sink (Leads to Exit)
        // For all Rectangles, set edges as source (to protect area) and area as unused
        let r = null;
        let j = 0;
        const jmax = rect.length;
        // Check bounds
        if (bounds.x1 >= bounds.x2 || bounds.y1 >= bounds.y2 ||
            bounds.x1 < 0 || bounds.y1 < 0 || bounds.x2 > 49 || bounds.y2 > 49)
            return console.log('ERROR: Invalid bounds', JSON.stringify(bounds));
        for (; j < jmax; j++) {
            r = rect[j];

            let x = r.x1;
            const maxx = r.x2 + 1;
            let y = r.y1;
            const maxy = r.y2 + 1;
            for (; x < maxx; x++) {
                y = r.y1;
                for (; y < maxy; y++) {
                    if (x === r.x1 || x === r.x2 || y === r.y1 || y === r.y2) {
                        if (room_array[x][y] === NORMAL)
                            room_array[x][y] = PROTECTED;
                    } else
                        room_array[x][y] = UNWALKABLE;
                }
            }

        }
        // ********************** Visualisierung
        if (true) {
            let visual = new RoomVisual(roomname);
            let x = 0;
            let y = 0;
            const max = 50;
            for (; x < max; x++) {
                y = 0;
                for (; y < max; y++) {

                    if (room_array[x][y] === NORMAL) {

                        visual.rect(x - 0.5, y - 0.5, 1, 1, { fill: '#e8e863', opacity: 0.3 })
                        continue
                    }
                }
            }
        }

        // initialise graph
        // possible 2*50*50 +2 (st) Vertices (Walls etc set to unused later)
        let g = new Graph(2 * 50 * 50 + 2);
        let infini = Number.MAX_VALUE;
        let surr = [
            [0, -1],
            [-1, -1],
            [-1, 0],
            [-1, 1],
            [0, 1],
            [1, 1],
            [1, 0],
            [1, -1]
        ];
        // per Tile (0 in Array) top + bot with edge of c=1 from top to bott  (use every tile once!)
        // infini edge from bot to top vertices of adjacent tiles if they not protected (array =1) (no reverse edges in normal graph)
        // per prot. Tile (1 in array) Edge from source to this tile with infini cap.
        // per exit Tile (2in array) Edge to sink with infini cap.
        // source is at  pos 2*50*50, sink at 2*50*50+1 as first tile is 0,0 => pos 0
        // top vertices <-> x,y : v=y*50+x   and x= v % 50  y=v/50 (math.floor?)
        // bot vertices <-> top + 2500
        let source = 2 * 50 * 50;
        let sink = 2 * 50 * 50 + 1;
        let top = 0;
        let bot = 0;
        let dx = 0;
        let dy = 0;
        let x = 1;
        let y = 1;
        const max = 49;
        for (; x < max; x++) {
            y = 1;
            for (; y < max; y++) {
                top = y * 50 + x;
                bot = top + 2500;
                if (room_array[x][y] === NORMAL) { // normal Tile
                    g.New_edge(top, bot, 1);
                    for (let i = 0; i < 8; i++) {
                        dx = x + surr[i][0];
                        dy = y + surr[i][1];
                        if (room_array[dx][dy] === NORMAL || room_array[dx][dy] === TO_EXIT)
                            g.New_edge(bot, dy * 50 + dx, infini);
                    }
                } else if (room_array[x][y] === PROTECTED) { // protected Tile
                    g.New_edge(source, top, infini);
                    g.New_edge(top, bot, 1);
                    for (let i = 0; i < 8; i++) {
                        dx = x + surr[i][0];
                        dy = y + surr[i][1];
                        if (room_array[dx][dy] === NORMAL || room_array[dx][dy] === TO_EXIT)
                            g.New_edge(bot, dy * 50 + dx, infini);
                    }
                } else if (room_array[x][y] === TO_EXIT) { // near Exit
                    g.New_edge(top, sink, infini);
                }
            }
        }

        // graph finished
        return g;
    }

    // Removes unneccary cut-tiles if bounds are set to include some 	dead ends

    function delete_tiles_to_dead_ends(roomname: string, cut_tiles_array: Pos[]) {

        // Get Terrain and set all cut-tiles as unwalkable

        let room_array = room_2d_array(roomname);

        for (let i = cut_tiles_array.length - 1; i >= 0; i--) {
            room_array[cut_tiles_array[i].x][cut_tiles_array[i].y] = UNWALKABLE;
        }

        // Floodfill from exits: save exit tiles in array and do a bfs-like search

        let unvisited_pos = [];
        let y = 0;
        const max = 49;

        for (; y < max; y++) {

            if (room_array[1][y] === TO_EXIT) unvisited_pos.push(50 * y + 1)
            if (room_array[48][y] === TO_EXIT) unvisited_pos.push(50 * y + 48)
        }

        let x = 0;

        for (; x < max; x++) {
            if (room_array[x][1] === TO_EXIT) unvisited_pos.push(50 + x)
            if (room_array[x][48] === TO_EXIT) unvisited_pos.push(2400 + x) // 50*48=2400
        }

        // Iterate over all unvisited TO_EXIT- Tiles and mark neigbours as TO_EXIT tiles, if walkable (NORMAL), and add to unvisited

        let surr = [
            [0, -1],
            [-1, -1],
            [-1, 0],
            [-1, 1],
            [0, 1],
            [1, 1],
            [1, 0],
            [1, -1]
        ];
        let index, dx, dy;

        while (unvisited_pos.length > 0) {

            index = unvisited_pos.pop();
            x = index % 50;
            y = Math.floor(index / 50);

            for (let i = 0; i < 8; i++) {
                dx = x + surr[i][0];
                dy = y + surr[i][1];
                if (room_array[dx][dy] === NORMAL) {
                    unvisited_pos.push(50 * dy + dx);
                    room_array[dx][dy] = TO_EXIT;
                }
            }
        }
        // Remove min-Cut-Tile if there is no TO-EXIT  surrounding it
        let leads_to_exit = false;
        for (let i = cut_tiles_array.length - 1; i >= 0; i--) {

            leads_to_exit = false;
            x = cut_tiles_array[i].x;
            y = cut_tiles_array[i].y;

            for (let i = 0; i < 8; i++) {
                dx = x + surr[i][0];
                dy = y + surr[i][1];
                if (room_array[dx][dy] === TO_EXIT) {
                    leads_to_exit = true;
                }
            }

            if (!leads_to_exit) {
                cut_tiles_array.splice(i, 1);
            }
        }
    }

    // Function for user: calculate min cut tiles from room, rect[]

    function GetCutTiles(roomname: string, rect: any, bounds: Rect = { x1: 0, y1: 0, x2: 49, y2: 49 }, verbose = false) {

        let graph = create_graph(roomname, rect, bounds);

        if (!graph) return []

        let source = 2 * 50 * 50; // Position Source / Sink in Room-Graph

        let sink = 2 * 50 * 50 + 1;

        let count = graph.Calcmincut(source, sink);

        if (verbose) console.log('Number of Tiles in Cut:', count);

        let positions: Pos[] = []

        if (count > 0) {

            let cut_edges = graph.Bfsthecut(source);
            // Get Positions from Edge
            let u, x, y;
            let i = 0;
            const imax = cut_edges.length;

            for (; i < imax; i++) {

                u = cut_edges[i]; // x= v % 50  y=v/50 (math.floor?)
                x = u % 50;
                y = Math.floor(u / 50);

                positions.push({ x, y })
            }
        }

        // if bounds are given,
        // try to dectect islands of walkable tiles, which are not conntected to the exits, and delete them from the cut-tiles

        let whole_room = (bounds.x1 == 0 && bounds.y1 == 0 && bounds.x2 == 49 && bounds.y2 == 49);

        if (positions.length > 0 && !whole_room) delete_tiles_to_dead_ends(roomname, positions);

        return positions
    }

    // Operate the mincut algorithm
    // Example function: demonstrates how to get a min cut with 2 rectangles, which define a "to protect" area

    let cpu = Game.cpu.getUsed()

    // Rectangle Array, the Rectangles will be protected by the returned tiles

    const protectionRects: Rect[] = []

    //

    // Get the room's anchor

    const anchor: RoomPosition = room.get('anchor')

    // Get the controller

    const controller = room.controller

    // Protect it

    protectionRects.push({ x1: controller.pos.x - 1, x2: controller.pos.x + 1, y1: controller.pos.y - 1, y2: controller.pos.y + 1 })

    // Get the centerUpgradePos

    const centerUpgradePos: RoomPosition = room.get('centerUpgradePos')

    // Protect it

    protectionRects.push({ x1: centerUpgradePos.x - 3, x2: centerUpgradePos.x + 3, y1: centerUpgradePos.y - 3, y2: centerUpgradePos.y + 3 })

    // Get the source1ClosestHarvestPos

    const source1ClosestHarvestPos: RoomPosition = room.get('source1ClosestHarvestPosition')

    // Protect it

    protectionRects.push({ x1: source1ClosestHarvestPos.x - 3, x2: source1ClosestHarvestPos.x + 3, y1: source1ClosestHarvestPos.y - 3, y2: source1ClosestHarvestPos.y + 3 })

    // Get the source2ClosestHarvestPos

    const source2ClosestHarvestPos: RoomPosition = room.get('source2ClosestHarvestPosition')

    // Protect it

    protectionRects.push({ x1: source2ClosestHarvestPos.x - 3, x2: source2ClosestHarvestPos.x + 3, y1: source2ClosestHarvestPos.y - 3, y2: source2ClosestHarvestPos.y + 3 })

    // Get the room's stampAnchors

    const stampAnchors: StampAnchors = global[room.name].stampAnchors

    // Loop through types in stampAnchors

    for (const stampType in stampAnchors) {

        // Get the protectionOffset using the stampType

        const protectionOffset = constants.stamps[stampType as StampTypes].protectionOffset

        // Loop through anchors of this stampType's stampAnchors

        for (const anchor of stampAnchors[stampType as StampTypes]) {

            // Protect the stamp

            protectionRects.push({ x1: anchor.x - protectionOffset, x2: anchor.x + protectionOffset, y1: anchor.y - protectionOffset, y2: anchor.y + protectionOffset })
        }
    }

    // Boundary Array for Maximum Range

    const bounds = { x1: 0, x2: 49, y1: 0, y2: 49 }

    // Get Min cut
    // Positions is an array where to build walls/ramparts

    const positions = GetCutTiles(room.name, protectionRects, bounds)

    // Test output

    cpu = Game.cpu.getUsed() - cpu
    console.log('Needed', cpu, ' cpu time')

    return positions
}
