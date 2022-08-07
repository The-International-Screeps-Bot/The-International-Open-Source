// map.ts by Clarkok
/*

import { DebugKind, debug } from "./debug";

import {
    Point,
    EIGHT_MOVEMENTS,
    PointAdd,
    PointRangeArea,
    PointDist,
    PointInRangeOf,
    PointRangeAreaForEach,
    PointAtEdge,
    EIGHT_MOVEMENTS_DELTA
} from "./point";
import { PriorityQueue } from "./priority_queue";

export const M_PLAIN = 2;
export const M_ROAD = 1;
export const M_SWAMP = 10;
export const M_CONSTRUCTED_WALL = 255;
export const M_IMPOSSIBLE = 65535;

export const MAP_WIDTH = 50;
export const MAP_HEIGHT = 50;
export const MAP_SIZE = MAP_WIDTH * MAP_HEIGHT;

export class VXMap {
    data: Uint16Array;

    constructor(data: Uint16Array = new Uint16Array(MAP_SIZE)) {
        this.data = data;
    }

    fill(value: number) {
        this.data.fill(value);
    }

    get(x: number, y: number): number {
        return this.data[VXMap.idx(x, y)];
    }

    set(x: number, y: number, value: number) {
        this.data[VXMap.idx(x, y)] = value;
    }

    addTo(x: number, y: number, value: number) {
        this.data[VXMap.idx(x, y)] += value;
    }

    getPoint(p: Point): number {
        return this.get(p.x, p.y);
    }

    setPoint(p: Point, value: number) {
        this.set(p.x, p.y, value);
    }

    addToPoint(p: Point, value: number) {
        this.addTo(p.x, p.y, value);
    }

    clone(): VXMap {
        return new VXMap(new Uint16Array(this.data));
    }

    compress(): string {
        let result = "{1}"; // version

        for (let i = 0; i < this.data.length; ) {
            let j = i + 1;
            for (; j < this.data.length; ++j) {
                if (this.data[j] != this.data[i]) {
                    break;
                }
            }

            let item = `${this.data[i]}`;
            if (item.length > 1) {
                item = `|${item.length}${item}`;
            }

            switch (this.data[i]) {
                case M_PLAIN: {
                    item = "p";
                    break;
                }
                case M_ROAD: {
                    item = "r";
                    break;
                }
                case M_SWAMP: {
                    item = "s";
                    break;
                }
                case M_CONSTRUCTED_WALL: {
                    item = "w";
                    break;
                }
                case M_IMPOSSIBLE: {
                    item = "i";
                    break;
                }
            }

            if (j != i + 1) {
                let compacted = `{${item}:${j - i}}`;
                if (compacted.length < item.length * (j - i)) {
                    result += compacted;
                } else {
                    for (; i < j; ++i) {
                        result += item;
                    }
                }
            } else {
                result += item;
            }

            i = j;
        }

        return result;
    }

    map(f: (i: number) => number): VXMap {
        return new VXMap(this.data.map(f));
    }

    mapXY(f: (i: number, x: number, y: number) => number): VXMap {
        return new VXMap(
            this.data.map((v, i) => {
                let { x, y } = VXMap.pt(i);
                return f(v, x, y);
            })
        );
    }

    exitPoints(): Point[] {
        let ret = [];

        let x, y;
        for (let i = 0; i < MAP_WIDTH - 1; ++i) {
            // top
            x = i;
            y = 0;
            if (this.get(x, y) != M_IMPOSSIBLE) {
                ret.push({ x, y });
            }

            // left
            x = 0;
            y = i + 1;
            if (this.get(x, y) != M_IMPOSSIBLE) {
                ret.push({ x, y });
            }

            // bottom
            x = i + 1;
            y = MAP_HEIGHT - 1;
            if (this.get(x, y) != M_IMPOSSIBLE) {
                ret.push({ x, y });
            }

            // right
            x = MAP_WIDTH - 1;
            y = i;
            if (this.get(x, y) != M_IMPOSSIBLE) {
                ret.push({ x, y });
            }
        }

        return ret;
    }

    isOpenAround(p: Point, range: number): number {
        let { top, left, right, bottom } = PointRangeArea(p, range);
        let ret = 0;

        for (let y = top; y <= bottom; ++y) {
            let idx = VXMap.idx(left, y);
            for (let x = left; x <= right; ++x, ++idx) {
                if (this.data[idx] == M_IMPOSSIBLE) {
                    return M_IMPOSSIBLE;
                } else {
                    ret += this.data[idx];
                }
            }
        }

        return ret;
    }

    findPath(
        s: Point,
        d: Point | Point[],
        range: number = 1
    ): { path: Point[]; cost: number; target: Point } | null {
        let last = new Array<Point>(2500);
        let visited = new VXMap(new Uint16Array(MAP_SIZE).fill(M_IMPOSSIBLE));
        visited.set(s.x, s.y, 0);

        let dests: Point[];
        if (Array.isArray(d)) {
            dests = d;
        } else {
            dests = [d];
        }

        let q = new PriorityQueue<Point & { e: number }>(
            (a: Point & { e: number }, b: Point & { e: number }) => {
                let isRoadPointA =
                    Math.abs(a.x - a.y) % 4 == 0 ||
                    Math.abs(a.x + a.y) % 4 == 0;
                let isRoadPointB =
                    Math.abs(b.x - b.y) % 4 == 0 ||
                    Math.abs(b.x + b.y) % 4 == 0;

                let predA =
                    visited.getPoint(a) + a.e - (isRoadPointA ? 0.05 : 0);

                let predB =
                    visited.getPoint(b) + b.e - (isRoadPointB ? 0.05 : 0);

                return predA - predB;
            }
        );

        const pushToQueue = (p: Point) => {
            q.push({
                x: p.x,
                y: p.y,
                e: Math.min(...dests.map(d => PointDist(p, d)))
            });
        };

        pushToQueue(s);
        let minimalCost = M_IMPOSSIBLE;
        let arrival: Point | null = null;
        let target: Point | null = null;

        while (q.length != 0) {
            let p = q.pop() as Point;
            let pcost = visited.getPoint(p);

            for (let m of EIGHT_MOVEMENTS_DELTA) {
                let np = PointAdd(p, m);

                if (
                    np.x < 0 ||
                    np.x >= MAP_WIDTH ||
                    np.y < 0 ||
                    np.y >= MAP_HEIGHT
                ) {
                    continue;
                }

                if (this.get(np.x, np.y) == M_IMPOSSIBLE) {
                    continue;
                }

                let npcost = pcost + this.get(np.x, np.y);
                if (npcost >= minimalCost) {
                    continue;
                }

                if (npcost >= visited.getPoint(np)) {
                    continue;
                }

                last[VXMap.idx(np.x, np.y)] = p;
                visited.setPoint(np, npcost);

                let t = dests.find(d => PointInRangeOf(d, np, range));
                if (t) {
                    minimalCost = npcost;
                    arrival = np;
                    target = t;
                    continue;
                }

                pushToQueue(np);
            }
        }

        if (minimalCost == M_IMPOSSIBLE || !target) {
            return null;
        }

        let path = [];
        let p: Point | null = arrival as Point;

        while (p != null) {
            path.unshift(p);
            p = last[VXMap.idx(p.x, p.y)];
        }

        return {
            path,
            cost: minimalCost,
            target
        };
    }

    findPathToExit(
        s: Point
    ): { path: Point[]; cost: number; target: Point } | null {
        let last = new Array<Point>(2500);
        let visited = new VXMap(new Uint16Array(MAP_SIZE).fill(M_IMPOSSIBLE));
        visited.set(s.x, s.y, 0);

        let q = new PriorityQueue<Point & { e: number }>(
            (a: Point & { e: number }, b: Point & { e: number }) => {
                let isRoadPointA =
                    Math.abs(a.x - a.y) % 4 == 0 ||
                    Math.abs(a.x + a.y) % 4 == 0;
                let isRoadPointB =
                    Math.abs(b.x - b.y) % 4 == 0 ||
                    Math.abs(b.x + b.y) % 4 == 0;

                let predA =
                    visited.getPoint(a) + a.e - (isRoadPointA ? 0.05 : 0);

                let predB =
                    visited.getPoint(b) + b.e - (isRoadPointB ? 0.05 : 0);

                return predA - predB;
            }
        );

        const pushToQueue = (p: Point) => {
            q.push({
                x: p.x,
                y: p.y,
                e: Math.min(p.x, p.y, MAP_WIDTH - 1 - p.x, MAP_HEIGHT - 1 - p.y)
            });
        };

        pushToQueue(s);
        let minimalCost = M_IMPOSSIBLE;
        let arrival: Point | null = null;
        let target: Point | null = null;

        while (q.length != 0) {
            let p = q.pop() as Point;
            let pcost = visited.getPoint(p);

            for (let m of EIGHT_MOVEMENTS_DELTA) {
                let np = PointAdd(p, m);

                if (
                    np.x < 0 ||
                    np.x >= MAP_WIDTH ||
                    np.y < 0 ||
                    np.y >= MAP_HEIGHT
                ) {
                    continue;
                }

                if (this.get(np.x, np.y) == M_IMPOSSIBLE) {
                    continue;
                }

                let npcost = pcost + this.get(np.x, np.y);
                if (npcost >= minimalCost) {
                    continue;
                }

                if (npcost >= visited.getPoint(np)) {
                    continue;
                }

                last[VXMap.idx(np.x, np.y)] = p;
                visited.setPoint(np, npcost);

                if (PointAtEdge(np)) {
                    minimalCost = npcost;
                    arrival = np;
                    target = np;
                    continue;
                }

                pushToQueue(np);
            }
        }

        if (minimalCost == M_IMPOSSIBLE || !target) {
            return null;
        }

        let path = [];
        let p: Point | null = arrival as Point;

        while (p != null) {
            path.unshift(p);
            p = last[VXMap.idx(p.x, p.y)];
        }

        return {
            path,
            cost: minimalCost,
            target
        };
    }

    *findMinVertexCutToExitGen(
        startPoints: Point[],
        costMap?: VXMap
    ): Generator<number, Point[]> {
        const MOVEMENTS = [
            TOP,
            TOP_RIGHT,
            RIGHT,
            BOTTOM_RIGHT,
            BOTTOM,
            BOTTOM_LEFT,
            LEFT,
            TOP_LEFT
        ];

        let capacityMap = new Int32Array(MAP_SIZE * 18);
        capacityMap.fill(0);

        // initialize capacityMap
        let distantMap = VXMap.floodFillForDist(
            this,
            startPoints,
            false // backward
        );

        let exit = new Uint8Array(2500);
        exit.fill(0);

        for (let e of this.exitPoints()) {
            PointRangeAreaForEach(e, 1, (x, y) => {
                exit[VXMap.idx(x, y)] = 1;
                return true;
            });
        }

        for (let y = 0; y < MAP_HEIGHT; ++y) {
            let idx = VXMap.idx(0, y);
            for (let x = 0; x < MAP_WIDTH; ++x, ++idx) {
                let p = { x, y };
                let dp = distantMap.getPoint(p);

                if (dp == M_IMPOSSIBLE) {
                    continue;
                }

                capacityMap[idx * 9 + 8] = costMap?.get(x, y) ?? 1;
                for (let i = 0; i < 8; ++i) {
                    let m = EIGHT_MOVEMENTS[MOVEMENTS[i]];
                    let np = PointAdd({ x, y }, m);

                    if (
                        np.x < 0 ||
                        np.x >= MAP_WIDTH ||
                        np.y < 0 ||
                        np.y >= MAP_HEIGHT
                    ) {
                        continue;
                    }

                    let dnp = distantMap.getPoint(np);
                    if (dnp == M_IMPOSSIBLE) {
                        continue;
                    }

                    capacityMap[(idx + MAP_SIZE) * 9 + i] = 10000;
                }
            }
        }

        // [0, MAP_SIZE) means s, [MAP_SIZE, 2 * MAP_SIZE) means d
        let last = new Int32Array(MAP_SIZE * 2);
        let bfs = (): Point | null => {
            last.fill(-2);
            for (let p of startPoints) {
                last[VXMap.idx(p.x, p.y)] = -1;
            }

            let q = startPoints.map(p => VXMap.idx(p.x, p.y));

            while (q.length) {
                let opidx = q.shift() as number;

                let is_s = opidx < MAP_SIZE;
                let pidx = is_s ? opidx : opidx - MAP_SIZE;

                let p = VXMap.pt(pidx);

                if (capacityMap[opidx * 9 + 8]) {
                    let onpidx = is_s ? opidx + MAP_SIZE : opidx - MAP_SIZE;
                    if (last[onpidx] == -2 && capacityMap[opidx * 9 + 8]) {
                        last[onpidx] = (8 << 16) + opidx;
                        q.push(onpidx);
                    }
                }

                for (let i = 0; i < 8; ++i) {
                    if (capacityMap[opidx * 9 + i] == 0) {
                        continue;
                    }

                    let m = EIGHT_MOVEMENTS[MOVEMENTS[i]];
                    let np = PointAdd(p, m);

                    let npidx = VXMap.idx(np.x, np.y);
                    let onpidx = VXMap.idx(np.x, np.y) + (is_s ? MAP_SIZE : 0);

                    if (exit[npidx]) {
                        last[onpidx] = (i << 16) + opidx;
                        return np;
                    }

                    if (last[onpidx] != -2) {
                        continue;
                    }

                    last[onpidx] = (i << 16) + opidx;
                    q.push(onpidx);
                }
            }

            return null;
        };

        let revEdge = (opidx: number, i: number): [number, number] => {
            if (i == 8) {
                let is_s = opidx < MAP_SIZE;
                return [is_s ? opidx + MAP_SIZE : opidx - MAP_SIZE, i];
            } else {
                let is_s = opidx < MAP_SIZE;
                let pidx = opidx - (is_s ? 0 : MAP_SIZE);

                let p = VXMap.pt(pidx);

                let np = PointAdd(p, EIGHT_MOVEMENTS[MOVEMENTS[i]]);

                let onpidx = VXMap.idx(np.x, np.y) + (is_s ? MAP_SIZE : 0);
                let ri = (i + 4) % 8;

                return [onpidx, ri];
            }
        };

        let loosen = (p: Point): number => {
            let minCapacity = M_IMPOSSIBLE; // just a large number

            for (
                let res = last[VXMap.idx(p.x, p.y)];
                res != -1;
                res = last[res & 0xffff]
            ) {
                let l = res & 0xffff;
                let d = res >> 16;
                minCapacity = Math.min(minCapacity, capacityMap[l * 9 + d]);
            }

            for (
                let res = last[VXMap.idx(p.x, p.y)];
                res != -1;
                res = last[res & 0xffff]
            ) {
                let l = res & 0xffff;
                let d = res >> 16;
                capacityMap[l * 9 + d] -= minCapacity;

                let [np, rd] = revEdge(l, d);
                capacityMap[np * 9 + rd] += minCapacity;
            }

            return minCapacity;
        };

        let capacity = 0;
        for (let p = bfs(); p != null; p = bfs()) {
            yield capacity;
            capacity += loosen(p);
        }

        debug(DebugKind.Map, "Network capacity", capacity);

        let ret = new Array<Point>();

        let visited = new Array<number>(2500);
        let q = [...startPoints];
        for (let p of startPoints) {
            visited[VXMap.idx(p.x, p.y)] = 1;
        }

        while (q.length) {
            let p = q.shift() as Point;

            let sidx = VXMap.idx(p.x, p.y);
            let didx = sidx + MAP_SIZE;

            if (last[sidx] != -2 && last[didx] == -2) {
                ret.push(p);
            }

            for (let m of EIGHT_MOVEMENTS_DELTA) {
                let np = PointAdd(p, m);
                if (
                    np.x < 0 ||
                    np.x >= MAP_WIDTH ||
                    np.y < 0 ||
                    np.y >= MAP_HEIGHT
                ) {
                    continue;
                }

                if (visited[VXMap.idx(np.x, np.y)]) {
                    continue;
                }

                if (this.getPoint(np) == M_IMPOSSIBLE) {
                    continue;
                }

                visited[VXMap.idx(np.x, np.y)] = 1;
                q.push(np);
            }
        }

        return ret;
    }

    getExitTop(): { start: number; end: number }[] {
        let ret: { start: number; end: number }[] = [];

        for (let i = 0; i < MAP_WIDTH; ) {
            if (this.get(i, 0) == M_IMPOSSIBLE) {
                ++i;
                continue;
            }

            let j = i + 1;
            for (; j < MAP_WIDTH; ++j) {
                if (this.get(j, 0) == M_IMPOSSIBLE) {
                    break;
                }
            }

            ret.push({ start: i, end: j });
            i = j;
        }

        return ret;
    }

    getExitBottom(): { start: number; end: number }[] {
        let ret: { start: number; end: number }[] = [];

        for (let i = 0; i < MAP_WIDTH; ) {
            if (this.get(i, MAP_HEIGHT - 1) == M_IMPOSSIBLE) {
                ++i;
                continue;
            }

            let j = i + 1;
            for (; j < MAP_WIDTH; ++j) {
                if (this.get(j, MAP_HEIGHT - 1) == M_IMPOSSIBLE) {
                    break;
                }
            }

            ret.push({ start: i, end: j });
            i = j;
        }

        return ret;
    }

    getExitLeft(): { start: number; end: number }[] {
        let ret: { start: number; end: number }[] = [];

        for (let i = 0; i < MAP_HEIGHT; ) {
            if (this.get(0, i) == M_IMPOSSIBLE) {
                ++i;
                continue;
            }

            let j = i + 1;
            for (; j < MAP_HEIGHT; ++j) {
                if (this.get(0, j) == M_IMPOSSIBLE) {
                    break;
                }
            }

            ret.push({ start: i, end: j });
            i = j;
        }

        return ret;
    }

    getExitRight(): { start: number; end: number }[] {
        let ret: { start: number; end: number }[] = [];

        for (let i = 0; i < MAP_HEIGHT; ) {
            if (this.get(MAP_WIDTH - 1, i) == M_IMPOSSIBLE) {
                ++i;
                continue;
            }

            let j = i + 1;
            for (; j < MAP_HEIGHT; ++j) {
                if (this.get(MAP_WIDTH - 1, j) == M_IMPOSSIBLE) {
                    break;
                }
            }

            ret.push({ start: i, end: j });
            i = j;
        }

        return ret;
    }

    priorityDfs(
        startPoints: Point[],
        predict: (p: Point) => number,
        cb: (
            p: Point,
            last: Point
        ) => [boolean, boolean]
    ) {
        let last = new Array<Point>(MAP_SIZE);
        for (let p of startPoints) {
            last[VXMap.idx(p.x, p.y)] = p;
        }

        let q = new PriorityQueue<Point>((a, b) => predict(a) - predict(b));
        for (let s of startPoints) {
            q.push(s);
        }

        while (q.length) {
            let p = q.pop() as Point;

            for (let m of EIGHT_MOVEMENTS_DELTA) {
                let np = PointAdd(p, m);

                if (
                    np.x < 0 ||
                    np.x >= MAP_WIDTH ||
                    np.y < 0 ||
                    np.y >= MAP_HEIGHT
                ) {
                    continue;
                }

                if (last[VXMap.idx(np.x, np.y)]) {
                    continue;
                }

                if (this.getPoint(np) == M_IMPOSSIBLE) {
                    continue;
                }

                last[VXMap.idx(np.x, np.y)] = p;

                let [cont, enqueue] = cb(np, p);

                if (!cont) {
                    return;
                }

                if (enqueue) {
                    q.push(np);
                }
            }
        }
    }

    forQuads(): VXMap {
        let ret = new VXMap();
        for (let y = 0; y < MAP_HEIGHT - 1; ++y) {
            for (let x = 0; x < MAP_WIDTH - 1; ++x) {
                ret.set(
                    x,
                    y,
                    Math.max(
                        this.get(x, y),
                        this.get(x + 1, y),
                        this.get(x, y + 1),
                        this.get(x + 1, y + 1)
                    )
                );
            }
        }

        {
            const x = MAP_WIDTH - 1;
            for (let y = 0; y < MAP_HEIGHT - 1; ++y) {
                ret.set(x, y, Math.max(this.get(x, y), this.get(x, y + 1)));
            }
        }

        {
            const y = MAP_HEIGHT - 1;
            for (let x = 0; x < MAP_WIDTH - 1; ++x) {
                ret.set(x, y, Math.max(this.get(x, y), this.get(x + 1, y)));
            }
        }

        ret.set(MAP_WIDTH - 1, MAP_HEIGHT - 1, M_IMPOSSIBLE);
        return ret;
    }

    static findPathByDistMap(distMap: VXMap, p: Point): Point[] {
        let ret = [p];

        while (distMap.get(p.x, p.y) > 1) {
            let minNp: Point | null = null;
            for (let d of EIGHT_MOVEMENTS_DELTA) {
                let np = PointAdd(p, d);
                if (
                    np.x >= MAP_WIDTH ||
                    np.x < 0 ||
                    np.y >= MAP_HEIGHT ||
                    np.y < 0
                ) {
                    continue;
                }

                if (!minNp || distMap.getPoint(minNp) > distMap.getPoint(np)) {
                    minNp = np;
                }
            }

            if (!minNp) {
                return [];
            }

            p = minNp;
            ret.unshift(p);
        }

        return ret;
    }

    static decompress(compressed: string): VXMap | null {
        if (!compressed || compressed.length == 0) {
            return new VXMap();
        }

        const ParseItem = (compressed: string, i: number): [number, number] => {
            switch (compressed[i]) {
                case "p": {
                    return [M_PLAIN, i + 1];
                }
                case "r": {
                    return [M_ROAD, i + 1];
                }
                case "s": {
                    return [M_SWAMP, i + 1];
                }
                case "w": {
                    return [M_CONSTRUCTED_WALL, i + 1];
                }
                case "i": {
                    return [M_IMPOSSIBLE, i + 1];
                }
                case "|": {
                    ++i;
                    let len = parseInt(compressed[i], 10);
                    ++i;
                    return [parseInt(compressed.substr(i, len)), i + len];
                }
                default: {
                    let ret = parseInt(compressed[i], 10);
                    return [ret, i + 1];
                }
            }
        };

        let data = new Uint16Array(MAP_SIZE);

        let result = compressed.match(/^\{(\d+)\}/);
        if (!result || result[1] != "1") {
            return null;
        }

        let idx = 0;
        for (let i = result[0].length; i < compressed.length; ) {
            if (compressed[i] == "{") {
                if (++i >= compressed.length) {
                    return null;
                }

                let item: number;
                [item, i] = ParseItem(compressed, i);

                if (compressed[i] != ":") {
                    return null;
                }

                if (++i >= compressed.length) {
                    return null;
                }

                let count: number = parseInt(compressed.substr(i));
                if (isNaN(count)) {
                    return null;
                }

                i += `${count}`.length;

                if (compressed[i] != "}") {
                    return null;
                }

                ++i;
                while (count--) {
                    data[idx++] = item;
                }
            } else {
                [data[idx++], i] = ParseItem(compressed, i);
            }
        }

        return new VXMap(data);
    }

    static idx(x: number, y: number): number {
        return y * MAP_WIDTH + x;
    }

    static pt(idx: number): Point {
        return {
            x: idx % MAP_WIDTH,
            y: (idx / MAP_WIDTH) | 0
        };
    }

    static extendWalkable(costMap: VXMap, dest: VXMap, range: number) {
        for (let y = 0; y < MAP_HEIGHT; ++y) {
            for (let x = 0; x < MAP_WIDTH; ++x) {
                let c = costMap.get(x, y);
                if (c != M_IMPOSSIBLE) {
                    dest.set(x, y, c);
                    continue;
                }

                for (
                    let dy = Math.max(0, y - range);
                    dy <= Math.min(MAP_HEIGHT - 1, y + range);
                    ++dy
                ) {
                    for (
                        let dx = Math.max(0, x - range);
                        dx <= Math.min(MAP_WIDTH - 1, x + range);
                        ++dx
                    ) {
                        c = costMap.get(dx, dy);
                        if (c != M_IMPOSSIBLE) {
                            break;
                        }
                    }

                    if (c != M_IMPOSSIBLE) {
                        break;
                    }
                }

                dest.set(x, y, c);
            }
        }
    }

    static floodFillForValue(
        costMap: VXMap,
        startPoints: Point[],
        dest: VXMap,
        value: number,
        movements: Point[] = EIGHT_MOVEMENTS_DELTA,
        emptyValue: number = 0
    ) {
        let qx: number[] = startPoints.map(p => p.x);
        let qy: number[] = startPoints.map(p => p.y);

        for (let p of startPoints) {
            dest.set(p.x, p.y, value);
        }

        while (qx.length) {
            let p = { x: qx.shift() as number, y: qy.shift() as number };

            for (let m of movements) {
                let np = PointAdd(p, m);

                if (
                    np.x < 0 ||
                    np.x >= MAP_WIDTH ||
                    np.y < 0 ||
                    np.y >= MAP_HEIGHT
                ) {
                    continue;
                }

                if (
                    costMap.get(np.x, np.y) == M_IMPOSSIBLE ||
                    costMap.get(np.x, np.y) == M_CONSTRUCTED_WALL ||
                    dest.get(np.x, np.y) != emptyValue
                ) {
                    continue;
                }

                dest.set(np.x, np.y, value);
                qx.push(np.x);
                qy.push(np.y);
            }
        }
    }

    static floodFillForDist(
        costMap: VXMap,
        startPoints: { p: Point; s: number }[] | Point[],
        backward: boolean = false
    ): VXMap {
        let qx: number[];
        let qy: number[];

        let retData = new Uint16Array(MAP_SIZE);
        retData.fill(M_IMPOSSIBLE);

        if ("p" in startPoints[0]) {
            qx = (startPoints as { p: Point; s: number }[]).map(p => p.p.x);
            qy = (startPoints as { p: Point; s: number }[]).map(p => p.p.y);

            for (let p of startPoints as { p: Point; s: number }[]) {
                retData[VXMap.idx(p.p.x, p.p.y)] = 0;
            }
        } else {
            qx = (startPoints as Point[]).map(p => p.x);
            qy = (startPoints as Point[]).map(p => p.y);

            for (let p of startPoints as Point[]) {
                retData[VXMap.idx(p.x, p.y)] = 0;
            }
        }

        while (qx.length) {
            let px = qx.shift() as number;
            let py = qy.shift() as number;
            let pcost = retData[VXMap.idx(px, py)];

            for (let m of EIGHT_MOVEMENTS_DELTA) {
                let npx = px + m.x;
                let npy = py + m.y;
                if (
                    npx < 0 ||
                    npx >= MAP_WIDTH ||
                    npy < 0 ||
                    npy >= MAP_HEIGHT
                ) {
                    continue;
                }

                if (costMap.get(npx, npy) == M_IMPOSSIBLE) {
                    continue;
                }

                let idxNp = VXMap.idx(npx, npy);
                let npcost =
                    pcost +
                    (backward ? costMap.get(npx, npy) : costMap.get(px, py));

                if (retData[idxNp] > npcost) {
                    retData[idxNp] = npcost;
                    qx.push(npx);
                    qy.push(npy);
                }
            }
        }

        return new VXMap(retData);
    }

    static *floodFillForDistMultiRoomGen(
        startPoints: { p: Point; l: Point; s: number }[],
        targetRoomLoc: Point,
        roomCallback: (r: Point) => VXMap | false
    ): Generator<number, VXMap> {
        const locToNum = (l: Point): number => ((l.x + 128) << 8) + (l.y + 128);
        const numToLoc = (l: number): Point => {
            return { x: (l >> 8) - 128, y: (l & 0xff) - 128 };
        };

        const terrains = new Map<number, VXMap | false>();
        const getTerrain = (l: Point | number): VXMap | false => {
            if (typeof l != "number") {
                l = locToNum(l);
            }

            let t = terrains.get(l);
            if (typeof t == "undefined") {
                t = roomCallback(numToLoc(l));
                terrains.set(l, t);
            }

            return t;
        };

        const dists = new Map<number, VXMap>();
        const getDist = (l: Point | number): VXMap => {
            if (typeof l != "number") {
                l = locToNum(l);
            }

            let d = dists.get(l);
            if (!d) {
                d = new VXMap();
                d.fill(M_IMPOSSIBLE);
                dists.set(l, d);
            }

            return d;
        };

        // bits for elements in the queue:
        // 0 - 7: y in the room
        // 8 - 15: x in the room
        // 16 - 31: locToNum
        // 32 - 52: dist to startPoints
        const queue = new PriorityQueue<{ p: number; d: number }>(
            (a, b): number => a.d - b.d
        );
        const pushQueue = (x: number, y: number, loc: number, dist: number) => {
            if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) {
                throw new Error(`Out of range! (${x}, ${y})`);
            }

            queue.push({
                p: ((loc & 0xffff) << 16) + ((x & 0xff) << 8) + (y & 0xff),
                d: dist
            });
        };
        const popQueue = ():
            | undefined
            | { x: number; y: number; l: number; d: number } => {
            let f = queue.pop();
            if (typeof f == "undefined") {
                return undefined;
            }

            return {
                x: (f.p >> 8) & 0xff,
                y: f.p & 0xff,
                l: (f.p >> 16) & 0xffff,
                d: f.d
            };
        };

        for (let s of startPoints) {
            let d = getDist(s.l);
            d.set(s.p.x, s.p.y, s.s);
            pushQueue(s.p.x, s.p.y, locToNum(s.l), s.s);
        }

        let counter = 0;
        while (queue.length != 0) {
            if (++counter % 1000 == 0) {
                yield counter;
            }

            let f = popQueue()!;

            let t = getTerrain(f.l);
            if (!t) {
                continue;
            }

            let d = getDist(f.l);
            if (f.d != d.get(f.x, f.y)) {
                continue;
            }

            for (let m of EIGHT_MOVEMENTS_DELTA) {
                let np = PointAdd(f, m);
                if (
                    np.x < 0 ||
                    np.x >= MAP_WIDTH ||
                    np.y < 0 ||
                    np.y >= MAP_HEIGHT
                ) {
                    continue;
                }

                if (t.get(np.x, np.y) == M_IMPOSSIBLE) {
                    continue;
                }

                if (!PointAtEdge(np)) {
                    let nd = f.d + t.get(np.x, np.y);
                    if (d.get(np.x, np.y) > nd) {
                        d.set(np.x, np.y, nd);
                        pushQueue(np.x, np.y, f.l, nd);
                    }
                } else {
                    let loc = numToLoc(f.l);

                    if (np.x <= 0) {
                        --loc.x;
                        np.x = MAP_WIDTH - 1;
                    } else if (np.x >= MAP_WIDTH - 1) {
                        ++loc.x;
                        np.x = 0;
                    } else if (np.y <= 0) {
                        --loc.y;
                        np.y = MAP_HEIGHT - 1;
                    } else {
                        ++loc.y;
                        np.y = 0;
                    }

                    let nl = locToNum(loc);
                    let nt = getTerrain(nl);
                    if (!nt) {
                        continue;
                    }

                    let nnd = getDist(nl);
                    let nd = f.d + 1;
                    if (nnd.get(np.x, np.y) > nd) {
                        nnd.set(np.x, np.y, nd);
                        pushQueue(np.x, np.y, nl, nd);
                    }
                }
            }
        }

        return getDist(targetRoomLoc);
    }

    static floodFillForDistMultiRoom(
        startPoints: { p: Point; l: Point; s: number }[],
        targetRoomLoc: Point,
        roomCallback: (r: Point) => VXMap | false
    ): VXMap {
        let gen = VXMap.floodFillForDistMultiRoomGen(
            startPoints,
            targetRoomLoc,
            roomCallback
        );
        while (true) {
            let ret = gen.next();
            if (ret.done) {
                return ret.value;
            }
        }
    }

    static pointPathAreaForEach(
        costMap: VXMap,
        startPoints: Point[],
        range: number,
        cb: (x: number, y: number) => boolean
    ) {
        let qx: number[] = startPoints.map(p => p.x);
        let qy: number[] = startPoints.map(p => p.y);

        let dist = new Uint16Array(MAP_SIZE);
        dist.fill(M_IMPOSSIBLE);

        for (let p of startPoints) {
            if (dist[VXMap.idx(p.x, p.y)] != M_IMPOSSIBLE) {
                continue;
            }

            if (!cb(p.x, p.y)) {
                return;
            }

            dist[VXMap.idx(p.x, p.y)] = 0;
        }

        while (qx.length) {
            let p = { x: qx.shift() as number, y: qy.shift() as number };
            let pcost = dist[VXMap.idx(p.x, p.y)];

            for (let m of EIGHT_MOVEMENTS_DELTA) {
                let np = PointAdd(p, m);
                if (
                    np.x < 0 ||
                    np.x >= MAP_WIDTH ||
                    np.y < 0 ||
                    np.y >= MAP_HEIGHT
                ) {
                    continue;
                }

                if (costMap.get(np.x, np.y) == M_IMPOSSIBLE) {
                    continue;
                }

                let idxNp = VXMap.idx(np.x, np.y);
                let npcost = pcost + costMap.get(np.x, np.y);

                if (dist[idxNp] > npcost && npcost <= range) {
                    if (dist[idxNp] == M_IMPOSSIBLE) {
                        if (!cb(np.x, np.y)) {
                            return;
                        }
                    }

                    dist[idxNp] = npcost;
                    qx.push(np.x);
                    qy.push(np.y);
                }
            }
        }
    }
}
*/
