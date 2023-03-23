/* import { OBSTACLE_COST, UNREACHABLE_COST } from '../consts/consts';
import { cBall, forEachXYInRect } from '../coordinates/Rect';
import { cropToRoom, forEachXYAround, roomExits, roomRect } from '../coordinates/room';
import { addXY, mulXY, XY, xyAround, XYMap, XYSet } from '../coordinates/XY';
import { KeyedMap } from '../data-structures/KeyedMap';
import { KeyedSet } from '../data-structures/KeyedSet';
import { Matrix } from '../data-structures/Matrix';
import { OrderedMap } from '../data-structures/OrderedMap';
import { assert, choose } from '../utils/jsUtils';
import { cDistanceTransform, obstacles2baseDistanceTransformMatrix } from './distance-transform';
import { floodFill } from './flood-fill';
import { Graph } from './graph';

export interface ChunkGraph {
  xyChunks: KeyedMap<XY, number>;
  graph: Graph<XY>;
}

export function chunkGraph(obstacles: KeyedSet<XY>, chunkRadius?: number, travelDistance?: number, minimumChunkSize?: number): ChunkGraph {
  const chunkR = chunkRadius ?? 5;
  const travelDist = travelDistance ?? Math.floor(chunkR * 3 / 4);
  const minChunkSize = minimumChunkSize ?? chunkR * chunkR;

  const xyChunks = XYMap<number>();
  const graph = new Graph<XY>();

  const dt = obstacles2baseDistanceTransformMatrix(obstacles);
  cDistanceTransform(dt);

  const exitDistances = floodFill(obstacles, roomExits(obstacles));

  const xyByExitDistance: { xy: XY, dist: number }[] = [];
  forEachXYInRect(roomRect(), ({ x, y }) => {
    const dist = exitDistances.get(x, y);
    if (dist < UNREACHABLE_COST) {
      xyByExitDistance.push({ xy: { x, y }, dist });
    }
  });
  xyByExitDistance.sort(({ dist: dist1 }, { dist: dist2 }) => dist2 - dist1);

  const combinedFF = new Matrix();
  combinedFF.fill(UNREACHABLE_COST);

  const obstaclesAndExisting = obstacles.clone();

  xyByExitDistance.forEach(({ xy: centerXYCandidate }) => {
    // Select the furthest away unassigned point.
    if (combinedFF.get(centerXYCandidate.x, centerXYCandidate.y) < UNREACHABLE_COST) {
      return;
    }

    // Having the furthest unassigned point, travel towards local maximum by distance transform by at most
    // chunkRadius * 3 / 4 tiles, searching for unassigned points.
    let centerXY = centerXYCandidate;
    for (let i = 0; i <= Math.floor(travelDist); ++i) {
      const around = xyAround(centerXY).filter((near) => !xyChunks.has(near));

      let candidates = around.filter((near) => dt.get(centerXY.x, centerXY.y) < dt.get(near.x, near.y));
      if (candidates.length === 0) {
        candidates = around.filter((near) => dt.get(centerXY.x, centerXY.y) === dt.get(near.x, near.y));
      }

      if (candidates.length === 0) {
        break;
      } else {
        centerXY = choose(candidates);
      }
    }

    // Creating a new chunk.
    const chunk = graph.vertices.size + 1;
    graph.addVertex(chunk, centerXY);
    const chunkRect = cropToRoom(cBall(centerXY, chunkR));

    // Flood fill th the immediate area to see which points are closer to this new center.
    const chunkFF = floodFill(obstacles, centerXY, chunkRect);
    forEachXYInRect(chunkRect, (xy) => {
      const { x, y } = xy;
      const chunkXY = addXY(xy, mulXY(chunkRect.topLeft, -1));
      const centerDist = chunkFF.get(chunkXY.x, chunkXY.y);
      if (centerDist < combinedFF.get(x, y)) {
        combinedFF.set(x, y, centerDist);
        xyChunks.set(xy, chunk);
        obstaclesAndExisting.add(xy);
      }
    });
  });

  // Removing assignment of chunks that are disconnected from the center and chunks that are too small.
  // Starting from detecting which tiles are still connected to their chunk center.
  const assignedXY = XYSet(...graph.vertices.values());

  {
    let layer = [...graph.vertices.values()];
    while (layer.length !== 0) {
      const nextLayer: XY[] = [];
      layer.forEach((xy) => {
        const chunk = xyChunks.get(xy);
        forEachXYAround(xy, (near) => {
          if (xyChunks.get(near) === chunk && !assignedXY.has(near)) {
            assignedXY.add(near);
            nextLayer.push(near);
          }
        });
      });
      layer = nextLayer;
    }
  }

  const unassignedXY = XYSet();

  xyChunks.forEach((xy) => {
    if (!assignedXY.has(xy)) {
      unassignedXY.add(xy);
      xyChunks.delete(xy);
    }
  });

  // Creating a reverse of xyChunks.
  const chunkXYs = new Map<number, XY[]>();
  xyChunks.forEach(({ x, y }, chunk) => {
    if (chunk !== OBSTACLE_COST) {
      const xys = chunkXYs.get(chunk);
      if (xys === undefined) {
        chunkXYs.set(chunk, [{ x, y }]);
      } else {
        xys.push({ x, y });
      }
    }
  });

  // Removing small chunks.
  chunkXYs.forEach((xys, chunk) => {
    if (xys.length < minChunkSize && chunkXYs.size > 1) {
      xys.forEach((xy) => {
        xyChunks.delete(xy);
        unassignedXY.add(xy);
      });
      chunkXYs.delete(chunk);
      graph.deleteVertex(chunk);
    }
  });

  // Attempting to assign the closest chunk to each unassigned tile.
  // Note that unassignedXY is expected to be small relative to xyChunks.
  const queue = new OrderedMap<number, { xy: XY, chunk: number }[]>();

  unassignedXY.forEach((xy) => {
    let closestChunk: number | undefined;
    let minDist = Infinity;
    forEachXYAround(xy, (near) => {
      const neighborChunk = xyChunks.get(near);
      if (neighborChunk !== undefined) {
        const dist = combinedFF.get(near.x, near.y);
        if (dist + 1 < minDist) {
          closestChunk = neighborChunk;
          minDist = dist + 1;
        }
      }
    });

    if (closestChunk !== undefined) {
      let queued = queue.get(minDist);
      if (queued === undefined) {
        queued = [];
        queue.set(minDist, queued);
      }
      queued.push({ xy, chunk: closestChunk });
    }
  });

  // Propagating chunks from the nodes that are the closest to their neighbors.
  for (let layer = queue.popMinimum(); layer !== undefined; layer = queue.popMinimum()) {
    const nextDist = layer.key + 1;
    layer.value.forEach(({ xy, chunk }) => {
      // A node may be added multiple times due to many neighbors, but this does not change anything besides
      // wasting time and should not happen too many times.
      if (unassignedXY.has(xy)) {
        unassignedXY.delete(xy);
        xyChunks.set(xy, chunk);
        chunkXYs.get(chunk)!.push(xy);

        forEachXYAround(xy, (near) => {
          if (unassignedXY.has(near)) {
            let queued = queue.get(nextDist);
            if (queued === undefined) {
              queued = [];
              queue.set(nextDist, queued);
            }
            queued.push({ xy: near, chunk });
          }
        });
      }
    });
  }

  // Edges directed into the direction of the nearest exit.
  const chunkExitDistances = new Map<number, number>();
  forEachXYInRect(roomRect(), ({ x, y }) => {
    const xyDist = exitDistances.get(x, y);
    if (xyDist < UNREACHABLE_COST) {
      const chunk = xyChunks.get({ x, y });
      assert(chunk !== undefined);
      const chunkDist = chunkExitDistances.get(chunk);
      if (chunkDist === undefined || xyDist < chunkDist) {
        chunkExitDistances.set(chunk, xyDist);
      }
    }
  });

  const processedChunks = new Set<number>();
  const sortedChunks = [...chunkExitDistances.entries()]
    .sort(([, v1], [, v2]) => v1 - v2)
    .map(([k]) => k);
  sortedChunks.forEach((chunk) => {
    const xys = chunkXYs.get(chunk);
    assert(xys !== undefined);

    const outEdgeChunks = new Set<number>();
    xys.forEach((xy) => {
      forEachXYAround(xy, (near) => {
        const nearChunk = xyChunks.get(near);
        if (nearChunk !== undefined && processedChunks.has(nearChunk) && !outEdgeChunks.has(nearChunk)) {
          outEdgeChunks.add(nearChunk);
          graph.setEdge(chunk, nearChunk, 1);
        }
      });
    });

    processedChunks.add(chunk);
  });

  return {
    xyChunks,
    graph
  };
}
 */
