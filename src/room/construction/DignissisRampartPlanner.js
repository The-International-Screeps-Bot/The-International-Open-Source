// coords: integer, 50*x+y
// getNeighbors(coords): returns an array of coords that are adjacent to the given coords
// isntWall(coords): returns true if given coords is not a wall

// Dignissi's mincut, 2022
// "Sink" is the mincut term for what we're defending.
const sinks = _(room.find(FIND_STRUCTURES))
     .map(x => getSquare(x, 2))
     .flatten()
     .uniq()
     .run()
const exits = _.map(room.find(FIND_EXIT), 'intCoord')
const allnodes = _([...Array(2500).keys()])
     .filter(isntWall)
     .difference(exits)
     .run()
const gen0 = _(exits).map(getNeighbors).flatten().uniq().filter(isntWall).difference(exits).run()
// Maxflow part: populate parents such that parents[i] is the tile you would come from to get to i from an exit.
const parents = {}
let dirty = false
outer: do {
     dirty = false
     let gen = 0
     const igen = {} // Inverse Generationalize: igen[i] is the flood-fill generation of tile i.
     const igen_all = _.filter(allnodes, x => !parents[x])
     let igen_open = _.intersection(igen_all, gen0)
     let igen_field = _.difference(igen_all, igen_open)
     while (igen_field.length && igen_open.length) {
          for (const o of igen_open) {
               igen[o] = gen
          }
          gen += 1
          igen_open = _(igen_open).map(getNeighbors).flatten().intersection(igen_field).run()
          igen_field = _.difference(igen_field, igen_open)
     } // End Inverse Generationalize
     for (const o of igen_open) {
          igen[o] = gen
     }
     gen += 1
     const deadend = new Set()
     for (const source of gen0) {
          // "Source" is the mincut term for the exits of the room.
          const path = [source] // Stack representing the path from the exit to the current tile.
          while (path.length) {
               // DFS all possible paths
               const head = path[path.length - 1]
               const child = _.find(getNeighbors(head), function (x) {
                    if (!igen[x] || parents[x] || deadend.has(x)) {
                         return false
                    }
                    return igen[x] > igen[head] // Children should be from higher generations
               })
               if (!child) {
                    deadend.add(head)
                    path.pop()
                    continue
               } // Hit leaf node in DFS.
               if (sinks.includes(child)) {
                    // Found a "sink".  Log a maxflow path.
                    if (path.length === 1) {
                         break
                    }
                    for (let i = 1; i < path.length; i += 1) {
                         parents[path[i]] = path[i - 1]
                    }
                    dirty = true
                    continue outer
               }
               path.push(child)
          }
     }
} while (dirty)
// Mincut part: based on parents (which conveys a cut edge from i to parents[i]), make walls.
let open = gen0
let closed = []
while (open.length) {
     // Pseudo-Flood Fill, but "swept downstream" by maxflow path to parents.
     closed = _.union(open, closed)
     open = _(open)
          .map(x => getNeighbors(parents[x] || x))
          .flatten()
          .uniq()
          .filter(isntWall)
          .difference(closed)
          .difference(sinks)
          .run()
}
const safeZone = _.difference(allnodes, closed)
const cut = _.filter(closed, x => _.intersection(getNeighbors(x), safeZone).length)
