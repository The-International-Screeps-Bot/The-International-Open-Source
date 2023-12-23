let wasm;
export function __wbg_set_wasm(val) {
    wasm = val;
}


const heap = new Array(128).fill(undefined);

heap.push(undefined, null, true, false);

function getObject(idx) { return heap[idx]; }

let heap_next = heap.length;

function dropObject(idx) {
    if (idx < 132) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

const lTextDecoder = typeof TextDecoder === 'undefined' ? (0, module.require)('util').TextDecoder : TextDecoder;

let cachedTextDecoder = new lTextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

let cachedUint8Memory0 = null;

function getUint8Memory0() {
    if (cachedUint8Memory0 === null || cachedUint8Memory0.byteLength === 0) {
        cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

let WASM_VECTOR_LEN = 0;

const lTextEncoder = typeof TextEncoder === 'undefined' ? (0, module.require)('util').TextEncoder : TextEncoder;

let cachedTextEncoder = new lTextEncoder('utf-8');

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8Memory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedInt32Memory0 = null;

function getInt32Memory0() {
    if (cachedInt32Memory0 === null || cachedInt32Memory0.byteLength === 0) {
        cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32Memory0;
}
/**
*/
export function wasm_function() {
    wasm.wasm_function();
}

/**
*/
export function log_setup() {
    wasm.log_setup();
}

/**
* Translates the `PWR_*` constants, which are types of powers used by power
* creeps
*/
export const PowerType = Object.freeze({ GenerateOps:1,"1":"GenerateOps",OperateSpawn:2,"2":"OperateSpawn",OperateTower:3,"3":"OperateTower",OperateStorage:4,"4":"OperateStorage",OperateLab:5,"5":"OperateLab",OperateExtension:6,"6":"OperateExtension",OperateObserver:7,"7":"OperateObserver",OperateTerminal:8,"8":"OperateTerminal",DisruptSpawn:9,"9":"DisruptSpawn",DisruptTower:10,"10":"DisruptTower",Shield:12,"12":"Shield",RegenSource:13,"13":"RegenSource",RegenMineral:14,"14":"RegenMineral",DisruptTerminal:15,"15":"DisruptTerminal",OperatePower:16,"16":"OperatePower",Fortify:17,"17":"Fortify",OperateController:18,"18":"OperateController",OperateFactory:19,"19":"OperateFactory", });
/**
* Translates the `EFFECT_*` constants, which are natural effect types
*/
export const NaturalEffectType = Object.freeze({ Invulnerability:1001,"1001":"Invulnerability",CollapseTimer:1002,"1002":"CollapseTimer", });
/**
* Translates `FIND_*` constants for interal API calls
*
* Unless you're storing the type of find constant to be used for a call, you
* likely want the constants which implement the `FindConstant` trait to make
* calls to find methods.
*
* This is hidden from the documentation to avoid confusion due to its narrow
* use case, but wasm_bindgen requires it remain public.
*/
export const Find = Object.freeze({
/**
* Find all exit positions at the top of the room
*/
ExitTop:1,"1":"ExitTop",ExitRight:3,"3":"ExitRight",ExitBottom:5,"5":"ExitBottom",ExitLeft:7,"7":"ExitLeft",Exit:10,"10":"Exit",Creeps:101,"101":"Creeps",MyCreeps:102,"102":"MyCreeps",HostileCreeps:103,"103":"HostileCreeps",SourcesActive:104,"104":"SourcesActive",Sources:105,"105":"Sources",DroppedResources:106,"106":"DroppedResources",Structures:107,"107":"Structures",MyStructures:108,"108":"MyStructures",HostileStructures:109,"109":"HostileStructures",Flags:110,"110":"Flags",ConstructionSites:111,"111":"ConstructionSites",MySpawns:112,"112":"MySpawns",HostileSpawns:113,"113":"HostileSpawns",MyConstructionSites:114,"114":"MyConstructionSites",HostileConstructionSites:115,"115":"HostileConstructionSites",Minerals:116,"116":"Minerals",Nukes:117,"117":"Nukes",Tombstones:118,"118":"Tombstones",PowerCreeps:119,"119":"PowerCreeps",MyPowerCreeps:120,"120":"MyPowerCreeps",HostilePowerCreeps:121,"121":"HostilePowerCreeps",Deposits:122,"122":"Deposits",Ruins:123,"123":"Ruins",ScoreContainers:10011,"10011":"ScoreContainers",ScoreCollectors:10012,"10012":"ScoreCollectors",SymbolContainers:10021,"10021":"SymbolContainers",SymbolDecoders:10022,"10022":"SymbolDecoders",Reactors:10051,"10051":"Reactors", });
/**
* Translates direction constants.
*/
export const Direction = Object.freeze({ Top:1,"1":"Top",TopRight:2,"2":"TopRight",Right:3,"3":"Right",BottomRight:4,"4":"BottomRight",Bottom:5,"5":"Bottom",BottomLeft:6,"6":"BottomLeft",Left:7,"7":"Left",TopLeft:8,"8":"TopLeft", });
/**
* Type used for when the game returns a direction to an exit.
*
* Restricted more than `Direction` in that it can't be diagonal. Used as the
* result of [`Room::find_exit_to`].
*
* Can be converted to [`Find`] for immediate use of [`Room::find`]
* and [`Direction`].
*
* [`Room::find`]: crate::objects::Room::find
* [`Room::find_exit_to`]: crate::objects::Room::find_exit_to
*/
export const ExitDirection = Object.freeze({ Top:1,"1":"Top",Right:3,"3":"Right",Bottom:5,"5":"Bottom",Left:7,"7":"Left", });
/**
* Translates `COLOR_*` and `COLORS_ALL` constants.
*/
export const Color = Object.freeze({ Red:1,"1":"Red",Purple:2,"2":"Purple",Blue:3,"3":"Blue",Cyan:4,"4":"Cyan",Green:5,"5":"Green",Yellow:6,"6":"Yellow",Orange:7,"7":"Orange",Brown:8,"8":"Brown",Grey:9,"9":"Grey",White:10,"10":"White", });
/**
* Translates `TERRAIN_*` constants.
*/
export const Terrain = Object.freeze({ Plain:0,"0":"Plain",Wall:1,"1":"Wall",Swamp:2,"2":"Swamp", });
/**
* Translates the `DENSITY_*` constants.
*/
export const Density = Object.freeze({ Low:1,"1":"Low",Moderate:2,"2":"Moderate",High:3,"3":"High",Ultra:4,"4":"Ultra", });
/**
*/
export class SearchGoal {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_searchgoal_free(ptr);
    }
    /**
    * @returns {any}
    */
    get pos() {
        const ret = wasm.searchgoal_pos(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @returns {number}
    */
    get range() {
        const ret = wasm.searchgoal_range(this.__wbg_ptr);
        return ret >>> 0;
    }
}

export function __wbindgen_object_drop_ref(arg0) {
    takeObject(arg0);
};

export function __wbg_setstackTraceLimit_1e311e6e52596ac7(arg0) {
    Error.stackTraceLimit = arg0;
};

export function __wbg_new_26f2ef54137daf0f() {
    const ret = new Error();
    return addHeapObject(ret);
};

export function __wbg_stack_18f5a1687f0ed62b(arg0, arg1) {
    const ret = getObject(arg1).stack;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
};

export function __wbg_log_1d3ae0273d8f4f8a(arg0) {
    console.log(getObject(arg0));
};

export function __wbg_time_68a30cc060fb3b34() {
    const ret = Game.time;
    return ret;
};

export function __wbindgen_string_new(arg0, arg1) {
    const ret = getStringFromWasm0(arg0, arg1);
    return addHeapObject(ret);
};

export function __wbg_static_accessor_ROOM_POSITION_PROTOTYPE_d4643cf4d6510229() {
    const ret = RoomPosition.prototype;
    return addHeapObject(ret);
};

export function __wbg_setpacked_89258774a17771a5(arg0, arg1) {
    getObject(arg0).__packedPos = arg1 >>> 0;
};

export function __wbg_notify_b34338f3fe2eb8a3(arg0, arg1, arg2) {
    Game.notify(getObject(arg0), arg1 === 0 ? undefined : arg2 >>> 0);
};

export function __wbg_create_07910c399d218ffe(arg0) {
    const ret = Object.create(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbindgen_throw(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};

