function findRampartPlacement(room) {

    // Terrain type constants

    const UNWALKABLE = -1;
    const NORMAL = 0;
    const PROTECTED = 1;
    const TO_EXIT = 2;
    const EXIT = 3;

    /**
     * An Array with Terrain information: -1 not usable, 2 Sink (Leads to Exit)
     */
    function room_2d_array(roomname, bounds = { x1: 0, y1: 0, x2: 49, y2: 49 }) {

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

        // mark Border Tiles near room edge as unwalkable

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

    function Graph(menge_v) {
        this.v = menge_v; // Vertex count
        this.level = Array(menge_v);
        this.edges = Array(menge_v).fill(0).map(x => []); // Array: for every vertex an edge Array mit {v,r,c,f} vertex_to,res_edge,capacity,flow
        this.New_edge = function(u, v, c) { // Adds new edge from u to v
            this.edges[u].push({ v: v, r: this.edges[v].length, c: c, f: 0 }); // Normal forward Edge
            this.edges[v].push({ v: u, r: this.edges[u].length - 1, c: 0, f: 0 }); // reverse Edge for Residal Graph
        };
        this.Bfs = function(s, t) { // calculates Level Graph and if theres a path from s to t
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
        };

        // DFS like: send flow at along path from s->t recursivly while increasing the level of the visited vertices by one
        // u vertex, f flow on path, t =Sink , c Array, c[i] saves the count of edges explored from vertex i

        this.Dfsflow = function(u, f, t, c) {
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
        };
        this.Bfsthecut = function(s) { // breadth-first-search which uses the level array to mark the vertices reachable from s

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
        };
        this.Calcmincut = function(s, t) { // calculates min-cut graph (Dinic Algorithm)
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
    }

    // Function to create Source, Sink, Tiles arrays: takes a rectangle-Array as input for Tiles that are to Protect
    // rects have top-left/bottom_right Coordinates {x1,y1,x2,y2}

    function create_graph(roomname, rect, bounds) {

        let room_array = room_2d_array(roomname, bounds); // An Array with Terrain information: -1 not usable, 2 Sink (Leads to Exit)
        // For all Rectangles, set edges as source (to protect area) and area as unused
        let r = null;
        let j = 0;
        const jmax = rect.length;

        // Check if near exit

        let exits = room.find(FIND_EXIT)

        let nearExit = false

        for (let exit of exits) {
            if (exit.getRangeTo(rect.x1, rect.y1) == 0 || exit.getRangeTo(rect.x2, rect.y2) == 0) {

                nearExit = true
                break
            }
        }

        if (nearExit) return console.log("ERROR: Too close to exit")

        //

        for (; j < jmax; j++) {

            r = rect[j];

            // Test sizes of rectangles

            if (r.x1 >= r.x2 || r.y1 >= r.y2) {

                return console.log('ERROR: Rectangle Nr.', j, JSON.stringify(r), 'invalid.');
            }

            let x = r.x1;
            const maxx = r.x2 + 1;
            let y = r.y1;
            const maxy = r.y2 + 1;

            for (; x < maxx; x++) {

                y = r.y1;

                for (; y < maxy; y++) {

                    if (x === r.x1 || x === r.x2 || y === r.y1 || y === r.y2) {

                        if (room_array[x][y] === NORMAL) room_array[x][y] = PROTECTED

                    } else room_array[x][y] = UNWALKABLE
                }
            }
        }

        if (true) {

            let visual = new RoomVisual(roomname);

            let x = 0;
            let y = 0;

            const max = 50;

            for (; x < max; x++) {

                y = 0;

                for (; y < max; y++) {

                    if (room_array[x][y] === UNWALKABLE)

                        visual.rect(x - 0.5, y - 0.5, 1, 1, { fill: '#111166', opacity: 0.3, stroke: "#111166", strokeWidth: 0.05 })

                    else if (room_array[x][y] === NORMAL)

                        visual.rect(x - 0.5, y - 0.5, 1, 1, { fill: '#e8e863', opacity: 0.3, stroke: "#e8e863", strokeWidth: 0.05 })

                    else if (room_array[x][y] === PROTECTED)

                        visual.rect(x - 0.5, y - 0.5, 1, 1, { fill: '#75e863', opacity: 0.3, stroke: "#75e863", strokeWidth: 0.05 })

                    else if (room_array[x][y] === TO_EXIT)

                        visual.rect(x - 0.5, y - 0.5, 1, 1, { fill: '#b063e8', opacity: 0.3, stroke: "#b063e8", strokeWidth: 0.05 })
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
        ]

        // per Tile (0 in Array) top + bottom with edge of c=1 from top to bottomt  (use every tile once!)
        // infini edge from bottom to top vertices of adjacent tiles if they not protected (array =1) (no reverse edges in normal graph)
        // per prot. Tile (1 in array) Edge from source to this tile with infini cap.
        // per exit Tile (2in array) Edge to sink with infini cap.
        // source is at  pos 2*50*50, sink at 2*50*50+1 as first tile is 0,0 => pos 0
        // top vertices <-> x,y : v=y*50+x   and x= v % 50  y=v/50 (math.floor?)
        // bottom vertices <-> top + 2500

        let source = 2 * 50 * 50;
        let sink = 2 * 50 * 50 + 1;
        let top = 0;
        let bottom = 0;
        let dx = 0;
        let dy = 0;
        let x = 1;
        let y = 1;
        const max = 49;

        for (; x < max; x++) {

            y = 1;

            for (; y < max; y++) {

                top = y * 50 + x;
                bottom = top + 2500;

                if (room_array[x][y] === NORMAL) { // normal Tile

                    // If normal tile do x

                    g.New_edge(top, bottom, 1);

                    for (let i = 0; i < 8; i++) {

                        dx = x + surr[i][0];
                        dy = y + surr[i][1];

                        if (room_array[dx][dy] === NORMAL || room_array[dx][dy] === TO_EXIT) g.New_edge(bottom, dy * 50 + dx, infini);
                    }
                } else if (room_array[x][y] === PROTECTED) {

                    // If protected tile do x

                    g.New_edge(source, top, infini);
                    g.New_edge(top, bottom, 1);

                    for (let i = 0; i < 8; i++) {

                        dx = x + surr[i][0];
                        dy = y + surr[i][1];

                        if (room_array[dx][dy] === NORMAL || room_array[dx][dy] === TO_EXIT) g.New_edge(bottom, dy * 50 + dx, infini);
                    }
                } else if (room_array[x][y] === TO_EXIT) {

                    // If exit tile do x

                    g.New_edge(top, sink, infini);
                }
            }
        }
        return g;
    }

    function delete_tiles_to_dead_ends(roomname, cut_tiles_array) { // Removes unneccary cut-tiles if bounds are set to include some 	dead ends
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

    function GetCutTiles(roomname, rect, bounds, verbose = false) {

        let graph = create_graph(roomname, rect, bounds);
        let source = 2 * 50 * 50; // Position Source / Sink in Room-Graph
        let sink = 2 * 50 * 50 + 1;
        let count = graph.Calcmincut(source, sink);

        if (verbose) console.log('NUmber of Tiles in Cut:', count);

        let positions = [];

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

                positions.push({ "x": x, "y": y });
            }
        }

        // if bounds are given,
        // try to dectect islands of walkable tiles, which are not conntected to the exits, and delete them from the cut-tiles

        let whole_room = (bounds.x1 == 0 && bounds.y1 == 0 && bounds.x2 == 49 && bounds.y2 == 49);
        if (positions.length > 0 && !whole_room)
            delete_tiles_to_dead_ends(roomname, positions);

        // Visualise Result

        if (true && positions.length > 0) {

            let visual = new RoomVisual(roomname);

            for (let i = positions.length - 1; i >= 0; i--) {

                visual.circle(positions[i].x, positions[i].y, { radius: 0.5, fill: colors.communeGreen, opacity: 0.8 });
            }
        }
        return positions;
    }

    function test(roomname) {

        //let room=Game.rooms[roomname];
        //if (!room)
        //    return 'O noes, no room';

        let cpu = Game.cpu.getUsed()

        let anchorPoint = room.get("anchorPoint")

        let source1Pos = room.get("source1").pos
        let source2Pos = room.get("source2").pos

        function sourceRect(pos) {

            // Check if near exit

            let exits = room.find(FIND_EXIT)

            for (let exit of exits) {

                if (exit.getRangeTo(pos) <= 3) return {}
            }

            // If not near give position for protection

            return { x1: pos.x - 4, y1: pos.y - 4, x2: pos.x + 4, y2: pos.y + 4 }
        }

        let controllerPos = room.get("controller").pos

        // Rectangle Array, the Rectangles will be protected by the returned tiles

        let rect_array = [
            { x1: anchorPoint.x - 9, y1: anchorPoint.y - 9, x2: anchorPoint.x + 9, y2: anchorPoint.y + 9 }, // Protect bunker
            sourceRect(source1Pos), // Protect source 1
            sourceRect(source2Pos), // Protect source 2
            { x1: controllerPos.x - 1, y1: controllerPos.y - 1, x2: controllerPos.x + 1, y2: controllerPos.y + 1 }, // Protect controller
        ]

        // Boundary Array for Maximum Range

        let bounds = { x1: 0, y1: 0, x2: 49, y2: 49 };

        // Get Min cut

        let rampartPositions = GetCutTiles(roomname, rect_array, bounds); // Positions is an array where to build walls/ramparts

        // Test output

        console.log('Positions count: ', rampartPositions.length);
        cpu = Game.cpu.getUsed() - cpu;
        console.log('Needed', cpu, ' cpu time');
        return 'Finished';
    }

    test(room.name)
}

module.exports = findRampartPlacement
module.exports = findRampartPlacement
module.exports = findRampartPlacement