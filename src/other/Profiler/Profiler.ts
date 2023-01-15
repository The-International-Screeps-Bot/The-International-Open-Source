// interface Memory {
//   profiler: ProfilerMemory;
// }

// interface ProfilerMemory {
//   data: { [name: string]: ProfilerData };
//   start?: number;
//   total: number;
// }

// interface ProfilerData {
//   calls: number;
//   time: number;
// }

// @ts-nocheck
interface Profiler {
    clear(): void
    output(): void
    start(): void
    status(): void
    stop(): void
    help(): void
}

export function init(): Profiler {
    const defaults = {
        data: {},
        total: 0,
    }

    if (!Memory.profiler) {
        Memory.profiler = defaults
    }

    const cli: Profiler = {
        clear() {
            const running = isEnabled()
            Memory.profiler = defaults
            if (running) {
                Memory.profiler.start = Game.time
            }
            return 'Profiler Memory cleared'
        },

        output(sortBy?: string) {
            outputProfilerData(sortBy)
            return 'Done'
        },

        start() {
            Memory.profiler.start = Game.time
            return 'Profiler started'
        },

        status() {
            if (isEnabled()) {
                return 'Profiler is running'
            }
            return 'Profiler is stopped'
        },

        stop() {
            if (!isEnabled()) {
                return
            }
            const timeRunning = Game.time - Memory.profiler.start!
            Memory.profiler.total += timeRunning
            delete Memory.profiler.start
            return 'Profiler stopped'
        },

        help() {
            return (
                'Profiler.start() - Starts the profiler\n' +
                'Profiler.stop() - Stops/Pauses the profiler\n' +
                'Profiler.status() - Returns whether is profiler is currently running or not\n' +
                'Profiler.output(sortBy ?: string) - Pretty-prints the collected profiler data to the console\n' +
                '    sortBy: name, calls, cpuPerCall, callsPerTick, cpuPerTick (default)\n' +
                this.status()
            )
        },
    }

    return cli
}

function wrapFunction(obj: object, key: PropertyKey, className?: string) {
    const descriptor = Reflect.getOwnPropertyDescriptor(obj, key)
    if (!descriptor || descriptor.get || descriptor.set) {
        return
    }

    if (key === 'constructor') {
        return
    }

    const originalFunction = descriptor.value
    if (!originalFunction || typeof originalFunction !== 'function') {
        return
    }

    // set a key for the object in memory
    if (!className) {
        className = obj.constructor ? `${obj.constructor.name}` : ''
    }
    const memKey = className + `:${key}`

    // set a tag so we don't wrap a function twice
    const savedName = `__${key}__`
    if (Reflect.has(obj, savedName)) {
        return
    }

    Reflect.set(obj, savedName, originalFunction)

    ///////////

    Reflect.set(obj, key, profileFn(memKey, originalFunction))
}

export function profileFn(memKey: string, fn: Function): Function {
    return function (this: any, ...args: any[]) {
        if (isEnabled()) {
            const start = Game.cpu.getUsed()
            const result = fn.apply(this, args)
            const end = Game.cpu.getUsed()
            record(memKey, end - start)
            return result
        }
        return fn.apply(this, args)
    }
}

export function profileApiAction(target: object, key: PropertyKey): void {
    const descriptor = Reflect.getOwnPropertyDescriptor(target, key)
    if (!descriptor || descriptor.get || descriptor.set) {
        console.log(`Failed to profile ${key} because it is a getter or setter`)
        return
    }

    if (key === 'constructor') {
        console.log(`Failed to profile ${key} because it is a constructor`)
        return
    }

    const originalFunction = descriptor.value
    if (!originalFunction || typeof originalFunction !== 'function') {
        console.log(`Failed to profile ${key} because it is not a function`)
        return
    }

    // set a tag so we don't wrap a function twice
    const savedName = `__${key}__`
    if (Reflect.has(target, savedName)) {
        return
    }

    Reflect.set(target, savedName, originalFunction)

    ///////////

    Reflect.set(target, key, function (this: any, ...args: any[]) {
        if (isEnabled()) {
            const result = originalFunction.apply(this, args)
            if (result === OK) {
                record('API Action', 0.2)
            }
            return result
        }
        return originalFunction.apply(this, args)
    })
}

export function profile(target: Function): void
export function profile(target: object, key: string | symbol, _descriptor: TypedPropertyDescriptor<Function>): void
export function profile(
    target: object | Function,
    key?: string | symbol,
    _descriptor?: TypedPropertyDescriptor<Function>,
): void {
    if (key) {
        // case of method decorator
        wrapFunction(target, key)
        return
    }

    // case of class decorator

    const ctor = target as any
    if (!ctor.prototype) {
        return
    }

    const className = ctor.name
    Reflect.ownKeys(ctor.prototype).forEach(k => {
        wrapFunction(ctor.prototype, k, className)
    })
}

function isEnabled(): boolean {
    return Memory.profiler.start !== undefined
}

function record(key: string | symbol, time: number) {
    if (!Memory.profiler.data[key]) {
        Memory.profiler.data[key] = {
            calls: 0,
            time: 0,
        }
    }
    Memory.profiler.data[key].calls++
    Memory.profiler.data[key].time += time
}

interface OutputData {
    name: string
    calls: number
    cpuPerCall: number
    callsPerTick: number
    cpuPerTick: number
}

function outputProfilerData(sortBy: string = 'cpuPerTick') {
    let totalTicks = Memory.profiler.total
    if (Memory.profiler.start) {
        totalTicks += Game.time - Memory.profiler.start
    }

    ///////
    // Process data
    let totalCpu = 0 // running count of average total CPU use per tick
    let calls: number
    let time: number
    let result: Partial<OutputData>
    const data = Reflect.ownKeys(Memory.profiler.data).map(key => {
        calls = Memory.profiler.data[key].calls
        time = Memory.profiler.data[key].time
        result = {}
        result.name = `${key}`
        result.calls = calls
        result.cpuPerCall = time / calls
        result.callsPerTick = calls / totalTicks
        result.cpuPerTick = time / totalTicks
        totalCpu += result.cpuPerTick
        return result as OutputData
    })

    data.sort((lhs, rhs) => (_.get(rhs, sortBy) as number) - (_.get(lhs, sortBy) as number))

    ///////
    // Format data
    let output = ''

    // get function name max length
    const longestName = _.max(data, d => d.name.length).name.length + 2

    //// Header line
    output += _.padRight('Function', longestName)
    output += _.padLeft('Tot Calls', 12)
    output += _.padLeft('CPU/Call', 12)
    output += _.padLeft('Calls/Tick', 12)
    output += _.padLeft('CPU/Tick', 12)
    output += _.padLeft('% of Tot\n', 12)

    ////  Data lines
    data.forEach(d => {
        output += _.padRight(`${d.name}`, longestName)
        output += _.padLeft(`${d.calls}`, 12)
        output += _.padLeft(`${d.cpuPerCall.toFixed(2)}ms`, 12)
        output += _.padLeft(`${d.callsPerTick.toFixed(2)}`, 12)
        output += _.padLeft(`${d.cpuPerTick.toFixed(2)}ms`, 12)
        output += _.padLeft(`${((d.cpuPerTick / totalCpu) * 100).toFixed(0)} %\n`, 12)
    })

    //// Footer line
    output += `${totalTicks} total ticks measured`
    output += `\t\t\t${totalCpu.toFixed(2)} average CPU profiled per tick`
    output += `\t\t\tsorted by ${sortBy}`
    console.log(output)
}

// debugging
// function printObject(obj: object) {
//   const name = obj.constructor ? obj.constructor.name : (obj as any).name;
//   console.log("  Keys of :", name, ":");
//   Reflect.ownKeys(obj).forEach((k) => {
//     try {
//       console.log(`    ${k}: ${Reflect.get(obj, k)}`);
//     } catch (e) {
//       // nothing
//     }
//   });
// }
