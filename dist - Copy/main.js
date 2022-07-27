'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const breakingVersion = 61;
const roomVisuals = false;
const baseVisuals = false;
const mapVisuals = false;
const cpuLogging = false;
const roomStats = 0;
const allyList = [
    'MarvinTMB',
    'Q13214',
    'HerrKai',
    'clarkok',
    'PandaMaster',
    'lokenwow',
    'Morningtea',
    'LittleBitBlue',
    'Raggy',
    'DefaultO',
];
const pixelSelling = false;
const pixelGeneration = false;
const tradeBlacklist = [''];
const autoClaim = true;
const publicRamparts = false;
const allyTrading = true;
const simpleAlliesSegment = 90;
const mmoShardNames = new Set(['shard0', 'shard1', 'shard2', 'shard3']);
const roomTypeProperties = {
    source1: true,
    source2: true,
    remotes: true,
    deposits: true,
    powerBanks: true,
    notClaimable: true,
    planned: true,
    commune: true,
    needs: true,
    sourceEfficacies: true,
    abandoned: true,
    owner: true,
    level: true,
    powerEnabled: true,
    towers: true,
    hasTerminal: true,
    energy: true,
    OT: true,
    DT: true,
    portalsTo: true,
};
const roomTypes = {
    commune: {
        source1: true,
        source2: true,
        remotes: true,
        deposits: true,
        powerBanks: true,
        planned: true,
    },
    remote: {
        commune: true,
        source1: true,
        source2: true,
        needs: true,
        sourceEfficacies: true,
        abandoned: true,
        notClaimable: true,
        planned: true,
    },
    ally: {
        owner: true,
        level: true,
    },
    allyRemote: {
        owner: true,
    },
    enemy: {
        owner: true,
        level: true,
        powerEnabled: true,
        towers: true,
        hasTerminal: true,
        energy: true,
        notClaimable: true,
        OT: true,
        DT: true,
    },
    enemyRemote: {
        owner: true,
        notClaimable: true,
    },
    neutral: {
        notClaimable: true,
        planned: true,
    },
    keeper: {
        owner: true,
    },
    keeperCenter: {
        owner: true,
    },
    highway: {
        commune: true,
    },
    intersection: {
        portalsTo: true,
    },
};
const roomTypesUsedForStats = ['commune', 'remote'];
const creepRoles = [
    'source1Harvester',
    'source2Harvester',
    'hauler',
    'controllerUpgrader',
    'builder',
    'maintainer',
    'mineralHarvester',
    'hubHauler',
    'fastFiller',
    'meleeDefender',
    'source1RemoteHarvester',
    'source2RemoteHarvester',
    'remoteHauler',
    'remoteReserver',
    'remoteDefender',
    'remoteCoreAttacker',
    'remoteDismantler',
    'scout',
    'claimer',
    'vanguard',
    'allyVanguard',
    'vanguardDefender',
    'antifaAssaulter',
    'antifaSupporter',
];
const communeSigns = ['A commune of the proletariat. Bourgeoisie not welcome here!'];
const nonCommuneSigns = [
    'The top 1% have more money than the poorest 4.5 billion',
    'McDonalds workers in the US make $10/hour. In Denmark, as a result of unions, they make $22/hour',
    'We have democracy in our policial system, why do we not have it in our companies?',
    'Workers of the world, unite!',
    'Real democracy requires democracy in the workplace - Richard Wolff',
    'Adults spend a combined 13 years of their life under a dictatorship: the workplace',
];
const roomDimensions = 50;
const allStructureTypes = [
    STRUCTURE_SPAWN,
    STRUCTURE_EXTENSION,
    STRUCTURE_ROAD,
    STRUCTURE_WALL,
    STRUCTURE_RAMPART,
    STRUCTURE_KEEPER_LAIR,
    STRUCTURE_PORTAL,
    STRUCTURE_CONTROLLER,
    STRUCTURE_LINK,
    STRUCTURE_STORAGE,
    STRUCTURE_TOWER,
    STRUCTURE_OBSERVER,
    STRUCTURE_POWER_BANK,
    STRUCTURE_POWER_SPAWN,
    STRUCTURE_EXTRACTOR,
    STRUCTURE_LAB,
    STRUCTURE_TERMINAL,
    STRUCTURE_CONTAINER,
    STRUCTURE_NUKER,
    STRUCTURE_FACTORY,
    STRUCTURE_INVADER_CORE,
];
const impassibleStructureTypes = [
    STRUCTURE_SPAWN,
    STRUCTURE_EXTENSION,
    STRUCTURE_WALL,
    STRUCTURE_KEEPER_LAIR,
    STRUCTURE_CONTROLLER,
    STRUCTURE_LINK,
    STRUCTURE_STORAGE,
    STRUCTURE_TOWER,
    STRUCTURE_OBSERVER,
    STRUCTURE_POWER_BANK,
    STRUCTURE_POWER_SPAWN,
    STRUCTURE_EXTRACTOR,
    STRUCTURE_LAB,
    STRUCTURE_TERMINAL,
    STRUCTURE_NUKER,
    STRUCTURE_FACTORY,
    STRUCTURE_INVADER_CORE,
];
const structureTypesByBuildPriority = [
    STRUCTURE_SPAWN,
    STRUCTURE_EXTENSION,
    STRUCTURE_CONTAINER,
    STRUCTURE_ROAD,
    STRUCTURE_STORAGE,
    STRUCTURE_TOWER,
    STRUCTURE_WALL,
    STRUCTURE_RAMPART,
    STRUCTURE_LINK,
    STRUCTURE_TERMINAL,
    STRUCTURE_EXTRACTOR,
    STRUCTURE_LAB,
    STRUCTURE_FACTORY,
    STRUCTURE_POWER_SPAWN,
    STRUCTURE_NUKER,
    STRUCTURE_OBSERVER,
];
({
    0: 'empty',
    1: STRUCTURE_SPAWN,
    2: STRUCTURE_EXTENSION,
    3: STRUCTURE_CONTAINER,
    4: STRUCTURE_TOWER,
    5: STRUCTURE_STORAGE,
    6: STRUCTURE_ROAD,
    7: STRUCTURE_WALL,
    8: STRUCTURE_RAMPART,
    9: STRUCTURE_TERMINAL,
    10: STRUCTURE_EXTRACTOR,
    11: STRUCTURE_LINK,
    12: STRUCTURE_LAB,
    13: STRUCTURE_FACTORY,
    14: STRUCTURE_POWER_SPAWN,
    15: STRUCTURE_NUKER,
    16: STRUCTURE_OBSERVER,
});
const myColors = {
    white: '#ffffff',
    lightGrey: '#eaeaea',
    midGrey: '#bcbcbc',
    darkGrey: '#5e5e5e',
    lightBlue: '#0f66fc',
    darkBlue: '#02007d',
    black: '#000000',
    yellow: '#d8f100',
    red: '#d10000',
    green: '#00d137',
    brown: '#aa7253',
};
const stamps = {
    fastFiller: {
        offset: 3,
        protectionOffset: 6,
        size: 4,
        structures: {
            extension: [
                { x: 1, y: 1 },
                { x: 2, y: 1 },
                { x: 3, y: 1 },
                { x: 3, y: 2 },
                { x: 2, y: 3 },
                { x: 4, y: 1 },
                { x: 5, y: 1 },
                { x: 4, y: 3 },
                { x: 1, y: 4 },
                { x: 3, y: 4 },
                { x: 1, y: 5 },
                { x: 2, y: 5 },
                { x: 4, y: 5 },
                { x: 5, y: 5 },
                { x: 5, y: 4 },
            ],
            road: [
                { x: 3, y: 0 },
                { x: 2, y: 0 },
                { x: 1, y: 0 },
                { x: 0, y: 1 },
                { x: 0, y: 2 },
                { x: 0, y: 3 },
                { x: 0, y: 4 },
                { x: 4, y: 0 },
                { x: 5, y: 0 },
                { x: 6, y: 1 },
                { x: 6, y: 2 },
                { x: 6, y: 4 },
                { x: 6, y: 3 },
                { x: 6, y: 5 },
                { x: 5, y: 6 },
                { x: 4, y: 6 },
                { x: 3, y: 6 },
                { x: 2, y: 6 },
                { x: 1, y: 6 },
                { x: 0, y: 5 },
            ],
            spawn: [
                { x: 1, y: 2 },
                { x: 5, y: 2 },
                { x: 3, y: 5 },
            ],
            container: [
                { x: 1, y: 3 },
                { x: 5, y: 3 },
            ],
            link: [{ x: 3, y: 3 }],
            empty: [
                { x: 2, y: 2 },
                { x: 4, y: 2 },
                { x: 2, y: 4 },
                { x: 4, y: 4 },
            ],
        },
    },
    hub: {
        offset: 2,
        protectionOffset: 5,
        size: 3,
        structures: {
            road: [
                { x: 1, y: 0 },
                { x: 2, y: 0 },
                { x: 3, y: 0 },
                { x: 0, y: 3 },
                { x: 0, y: 2 },
                { x: 0, y: 1 },
                { x: 1, y: 4 },
                { x: 2, y: 4 },
                { x: 4, y: 2 },
                { x: 4, y: 1 },
                { x: 3, y: 3 },
            ],
            extension: [{ x: 2, y: 3 }],
            link: [{ x: 1, y: 1 }],
            factory: [{ x: 2, y: 1 }],
            nuker: [{ x: 1, y: 2 }],
            terminal: [{ x: 1, y: 3 }],
            storage: [{ x: 3, y: 1 }],
            powerSpawn: [{ x: 3, y: 2 }],
            empty: [{ x: 2, y: 2 }],
        },
    },
    extensions: {
        offset: 2,
        protectionOffset: 3,
        size: 3,
        structures: {
            extension: [
                { x: 1, y: 2 },
                { x: 2, y: 1 },
                { x: 2, y: 3 },
                { x: 2, y: 2 },
                { x: 3, y: 2 },
            ],
            road: [
                { x: 1, y: 3 },
                { x: 0, y: 2 },
                { x: 1, y: 1 },
                { x: 2, y: 0 },
                { x: 3, y: 1 },
                { x: 4, y: 2 },
                { x: 3, y: 3 },
                { x: 2, y: 4 },
            ],
        },
    },
    labs: {
        offset: 2,
        protectionOffset: 5,
        size: 5,
        structures: {
            road: [
                { x: 3, y: 3 },
                { x: 2, y: 2 },
                { x: 1, y: 1 },
                { x: 0, y: 0 },
            ],
            empty: [
                { x: 0, y: 1 },
                { x: 0, y: 2 },
                { x: 1, y: 2 },
                { x: 1, y: 3 },
                { x: 2, y: 3 },
                { x: 1, y: 0 },
                { x: 2, y: 0 },
                { x: 2, y: 1 },
                { x: 3, y: 1 },
                { x: 3, y: 2 },
            ],
        },
    },
    tower: {
        offset: 0,
        protectionOffset: 2,
        size: 1,
        structures: {
            tower: [{ x: 0, y: 0 }],
        },
    },
    extension: {
        offset: 0,
        protectionOffset: 0,
        size: 1,
        structures: {
            extension: [{ x: 0, y: 0 }],
        },
    },
    observer: {
        offset: 0,
        protectionOffset: 0,
        size: 1,
        structures: {
            observer: [{ x: 0, y: 0 }],
        },
    },
    sourceLink: {
        offset: 0,
        protectionOffset: 0,
        size: 1,
        structures: {
            link: [{ x: 0, y: 0 }],
        },
    },
    sourceExtension: {
        offset: 0,
        protectionOffset: 0,
        size: 1,
        structures: {
            extension: [{ x: 0, y: 0 }],
        },
    },
    container: {
        offset: 0,
        protectionOffset: 0,
        size: 1,
        structures: {
            container: [{ x: 0, y: 0 }],
        },
    },
    extractor: {
        offset: 0,
        protectionOffset: 0,
        size: 1,
        structures: {
            extractor: [{ x: 0, y: 0 }],
        },
    },
    road: {
        offset: 0,
        protectionOffset: 0,
        size: 1,
        structures: {
            road: [{ x: 0, y: 0 }],
        },
    },
    rampart: {
        offset: 0,
        protectionOffset: 0,
        size: 1,
        structures: {
            rampart: [{ x: 0, y: 0 }],
        },
    },
};
const minerals = [
    RESOURCE_HYDROGEN,
    RESOURCE_OXYGEN,
    RESOURCE_UTRIUM,
    RESOURCE_KEANIUM,
    RESOURCE_LEMERGIUM,
    RESOURCE_ZYNTHIUM,
    RESOURCE_CATALYST,
];
[RESOURCE_CATALYZED_GHODIUM_ACID];
const remoteNeedsIndex = {
    source1RemoteHarvester: 0,
    source2RemoteHarvester: 1,
    remoteHauler: 2,
    remoteReserver: 3,
    remoteCoreAttacker: 4,
    remoteBuilder: 5,
    remoteDismantler: 6,
    minDamage: 7,
    minHeal: 8,
};
const claimRequestNeedsIndex = {
    claimer: 0,
    vanguard: 1,
    vanguardDefender: 2,
};
const allyCreepRequestNeedsIndex = {
    allyVanguard: 0,
};
const remoteHarvesterRoles = [
    'source1RemoteHarvester',
    'source2RemoteHarvester',
];
const spawnByRoomRemoteRoles = [
    'source1RemoteHarvester',
    'source2RemoteHarvester',
    'remoteReserver',
    'remoteDefender',
    'remoteCoreAttacker',
    'remoteDismantler',
];
const builderSpawningWhenStorageThreshold = 40000;
const upgraderSpawningWhenStorageThreshold = 60000;
const CPUBucketCapacity = 10000;
const CPUBucketRenewThreshold = 5000;
const prefferedCommuneRange = 6;
const controllerDowngradeUpgraderNeed = 10000;
const cacheAmountModifier = 25;
const minHarvestWorkRatio = 1.66666666667;
const UNWALKABLE = -1;
const NORMAL = 0;
const PROTECTED = 1;
const TO_EXIT = 2;
const EXIT = 3;
const safemodeTargets = [
    STRUCTURE_SPAWN,
    STRUCTURE_TOWER,
    STRUCTURE_EXTENSION,
    STRUCTURE_STORAGE,
    STRUCTURE_TERMINAL,
];

const importantStructures = [STRUCTURE_SPAWN, STRUCTURE_STORAGE, STRUCTURE_TERMINAL];
global.clearMemory = function () {
    for (const key in Memory)
        delete Memory[key];
    return 'Cleared all of Memory';
};
global.killAllCreeps = function (roles) {
    const filteredCreeps = Object.values(Game.creeps).filter(creep => {
        return !roles || roles.includes(creep.role);
    });
    let killedCreepCount = 0;
    for (const creep of filteredCreeps)
        if (creep.suicide() === OK)
            killedCreepCount += 1;
    return `Killed an total of ${killedCreepCount} creeps ${roles ? `with the roles ${roles}` : ''}`;
};
global.removeAllCSites = function (types) {
    let removedCSCount = 0;
    for (const cSiteID in Game.constructionSites) {
        const cSite = Game.constructionSites[cSiteID];
        if (types && !types.includes(cSite.structureType))
            continue;
        if (cSite.remove() === OK)
            removedCSCount += 1;
    }
    return `Removed a total of ${removedCSCount} construction sites ${types ? `with the types ${types}` : ''}`;
};
global.destroyAllStructures = function (roomName, types) {
    const room = Game.rooms[roomName];
    if (!room)
        return `You have no vision in ${roomName}`;
    let destroyedStructureCount = 0;
    for (const structureType of allStructureTypes) {
        if ((types && !types.includes(structureType)) || (importantStructures.includes(structureType) && !types))
            continue;
        const structures = room.structures[structureType];
        for (const structure of structures) {
            if (structure.destroy() === OK)
                destroyedStructureCount += 1;
        }
    }
    return `Destroyed a total of ${destroyedStructureCount} structures in ${roomName} ${types ? `with the types ${types}` : ''}`;
};
global.destroyCommuneStructures = function (types) {
    let log = ``;
    let destroyedStructureCount;
    for (const roomName of Memory.communes) {
        const room = Game.rooms[roomName];
        destroyedStructureCount = 0;
        for (const structureType of allStructureTypes) {
            if ((types && !types.includes(structureType)) || (importantStructures.includes(structureType) && !types))
                continue;
            const structures = room.structures[structureType];
            for (const structure of structures) {
                if (structure.destroy() === OK)
                    destroyedStructureCount += 1;
            }
            log += `Destroyed a total of ${destroyedStructureCount} structures in ${roomName}
               `;
        }
    }
    return log + ` ${types ? `with the types ${types}` : ''}`;
};
global.claim = function (request, communeName) {
    if (!Memory.claimRequests[request]) {
        Memory.claimRequests[request] = {
            responder: communeName,
            needs: [0],
            score: 0,
        };
    }
    if (communeName) {
        const roomMemory = Memory.rooms[communeName];
        if (!roomMemory)
            return `No memory for ${communeName}`;
        roomMemory.claimRequest = request;
    }
    return `${communeName ? `${communeName} is responding to the` : `created`} claimRequest for ${request}`;
};
global.attack = function (request, communeName) {
    if (!Memory.attackRequests[request]) {
        Memory.attackRequests[request] = {
            responder: communeName,
            needs: [0],
        };
    }
    if (communeName) {
        const roomMemory = Memory.rooms[communeName];
        if (!roomMemory)
            return `No memory for ${communeName}`;
        roomMemory.attackRequests.push(request);
    }
    return `${communeName ? `${communeName} is responding to the` : `created`} attackRequest for ${request}`;
};
global.allyCreepRequest = function (request, communeName) {
    if (!Memory.allyCreepRequests[request]) {
        Memory.allyCreepRequests[request] = {
            responder: communeName,
            needs: [0],
        };
    }
    if (communeName) {
        const roomMemory = Memory.rooms[communeName];
        if (!roomMemory)
            return `No memory for ${communeName}`;
        roomMemory.allyCreepRequest = request;
    }
    return `${communeName ? `${communeName} is responding to the` : `created`} allyCreepRequest for ${request}`;
};

const allyArray = [...allyList];
class AllyManager {
    constructor() {
        this.requestTypes = {
            RESOURCE: 0,
            DEFENSE: 1,
            ATTACK: 2,
            EXECUTE: 3,
            HATE: 4,
        };
    }
    getAllyRequests() {
        if (!Memory.allyTrading)
            return;
        if (!allyArray.length)
            return;
        if (Game.time % (10 * allyArray.length) >= allyArray.length)
            return;
        const currentAllyName = allyArray[Game.time % allyArray.length];
        if (RawMemory.foreignSegment && RawMemory.foreignSegment.username === currentAllyName) {
            try {
                this.allyRequests = JSON.parse(RawMemory.foreignSegment.data);
            }
            catch (err) { }
        }
        const nextAllyName = allyArray[(Game.time + 1) % allyArray.length];
        RawMemory.setActiveForeignSegment(nextAllyName, simpleAlliesSegment);
    }
    tickConfig() {
        this.myRequests = [];
        this.allyRequests = [];
    }
    endTickManager() {
        if (!Memory.allyTrading)
            return;
        if (Object.keys(RawMemory.segments).length < 10) {
            RawMemory.segments[simpleAlliesSegment] = JSON.stringify(this.myRequests);
            RawMemory.setPublicSegments([simpleAlliesSegment]);
        }
    }
    requestAttack(roomName, playerName, priority = 0) {
        this.myRequests.push({
            requestType: this.requestTypes.ATTACK,
            roomName,
            playerName,
            priority,
        });
    }
    requestHelp(roomName, priority = 0) {
        this.myRequests.push({
            requestType: this.requestTypes.DEFENSE,
            roomName,
            priority,
        });
    }
    requestHate(playerName, priority = 0) {
        this.myRequests.push({
            requestType: this.requestTypes.HATE,
            playerName,
            priority,
        });
    }
    requestResource(roomName, resourceType, maxAmount, priority = 0) {
        this.myRequests.push({
            requestType: this.requestTypes.RESOURCE,
            resourceType,
            maxAmount,
            roomName,
            priority,
        });
    }
}
const allyManager = new AllyManager();

function getAvgPrice(resourceType, days = 2) {
    const history = Game.market.getHistory(resourceType);
    let totalPrice = 0;
    for (let index = 0; index <= days; index += 1)
        totalPrice += history[index].avgPrice;
    return totalPrice / days;
}
function findObjectWithID(ID) {
    return Game.getObjectById(ID) || undefined;
}
function findPositionsInsideRect(x1, y1, x2, y2) {
    const positions = [];
    for (let x = x1; x <= x2; x += 1) {
        for (let y = y1; y <= y2; y += 1) {
            if (x < 0 || x >= roomDimensions || y < 0 || y >= roomDimensions)
                continue;
            positions.push({ x, y });
        }
    }
    return positions;
}
function arePositionsEqual(pos1, pos2) {
    return pos1.x === pos2.x && pos1.y === pos2.y;
}
function customLog(title, message, color = myColors.black, bgColor = myColors.white) {
    global.logs += `<div style='width: 85vw; text-align: center; align-items: center; justify-content: left; display: flex; background: ${bgColor};'><div style='padding: 6px; font-size: 16px; font-weigth: 400; color: ${color};'>${title}:</div>`;
    global.logs += `<div style='box-shadow: inset rgb(0, 0, 0, 0.1) 0 0 0 10000px; padding: 6px; font-size: 14px; font-weight: 200; color: ${color};'>${message}</div></div>`;
}
function newID() {
    return (Memory.ID += 1);
}
function advancedFindDistance(originRoomName, goalRoomName, typeWeights) {
    const findRouteResult = Game.map.findRoute(originRoomName, goalRoomName, {
        routeCallback(roomName) {
            if (roomName === goalRoomName)
                return 1;
            const roomMemory = Memory.rooms[roomName];
            if (!roomMemory)
                return Infinity;
            if (typeWeights[roomMemory.type])
                return typeWeights[roomMemory.type];
            return 2;
        },
    });
    if (findRouteResult === ERR_NO_PATH)
        return Infinity;
    return findRouteResult.length;
}
function findCarryPartsRequired(distance, income) {
    return (distance * 2 * income) / CARRY_CAPACITY;
}
function findAvgBetweenPosotions(pos1, pos2) {
    return {
        x: Math.floor((pos1.x + pos2.x) / 2),
        y: Math.floor((pos1.y + pos2.y) / 2),
    };
}
function getRange(x1, x2, y1, y2) {
    return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
}
function findClosestObject(target, objects) {
    let minRange = Infinity;
    let closest = undefined;
    for (const object of objects) {
        const range = getRange(target.x, object.pos.x, target.y, object.pos.y);
        if (range > minRange)
            continue;
        minRange = range;
        closest = object;
    }
    return closest;
}
function findClosestPos(target, positions) {
    let minRange = Infinity;
    let closest = undefined;
    for (const pos of positions) {
        const range = getRange(target.x, pos.x, target.y, pos.y);
        if (range > minRange)
            continue;
        minRange = range;
        closest = pos;
    }
    return closest;
}
function findCPUColor() {
    const CPU = Game.cpu.getUsed();
    if (CPU > Game.cpu.limit * 0.6)
        return myColors.green;
    if (CPU > Game.cpu.limit * 0.9)
        return myColors.green;
    return myColors.green;
}
function createPackedPosMap(innerArray) {
    const packedPosMap = [];
    for (let x = 0; x < roomDimensions; x += 1) {
        for (let y = 0; y < roomDimensions; y += 1) {
            packedPosMap.push(innerArray ? [] : undefined);
        }
    }
    return packedPosMap;
}
function unpackAsPos(packedPos) {
    return {
        x: Math.floor(packedPos / roomDimensions),
        y: Math.floor(packedPos % roomDimensions),
    };
}
function unpackAsRoomPos(packedPos, roomName) {
    return new RoomPosition(Math.floor(packedPos / roomDimensions), Math.floor(packedPos % roomDimensions), roomName);
}
function pack(pos) {
    return pos.x * roomDimensions + pos.y;
}
function packXY(x, y) {
    return x * roomDimensions + y;
}
function findRemoteSourcesByEfficacy(roomName) {
    const sourceNames = ['source1', 'source2'];
    const { sourceEfficacies } = Memory.rooms[roomName];
    if (sourceNames.length > sourceEfficacies.length)
        sourceNames.splice(sourceEfficacies.length - 1, 1);
    return sourceNames.sort(function (a, b) {
        return (Memory.rooms[roomName].sourceEfficacies[sourceNames.indexOf(a)] -
            Memory.rooms[roomName].sourceEfficacies[sourceNames.indexOf(b)]);
    });
}
function findLargestTransactionAmount(budget, amount, roomName1, roomName2) {
    budget = Math.max(budget, 1);
    while (Game.market.calcTransactionCost(amount, roomName1, roomName2) >= budget) {
        amount = (amount - 1) * 0.8;
    }
    return Math.floor(amount);
}
function findClosestCommuneName(roomName) {
    const communesNotThis = Memory.communes.filter(communeName => roomName !== communeName);
    return communesNotThis.sort((a, b) => Game.map.getRoomLinearDistance(roomName, a) - Game.map.getRoomLinearDistance(roomName, b))[0];
}
function findClosestClaimType(roomName) {
    const claimTypes = Memory.communes
        .concat(Object.keys(Memory.claimRequests))
        .filter(claimRoomName => roomName !== claimRoomName);
    return claimTypes.sort((a, b) => Game.map.getRoomLinearDistance(roomName, a) - Game.map.getRoomLinearDistance(roomName, b))[0];
}
function findClosestRoomName(start, targets) {
    let minRange = Infinity;
    let closest = undefined;
    for (const target of targets) {
        const range = Game.map.getRoomLinearDistance(start, target);
        if (range > minRange)
            continue;
        minRange = range;
        closest = target;
    }
    return closest;
}
function randomIntRange(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

class Market {
    constructor(mainShard = 'shard0') {
        this._minCpuUnlockSellPrice = 50 * 1000 * 1000;
        this._maxPixelBuyPrice = 40 * 1000;
        this._mainShard = mainShard;
    }
    SellCpuUnlock() {
        const orders = Game.market.getAllOrders(order => order.resourceType === CPU_UNLOCK &&
            order.type === ORDER_BUY &&
            order.price > this._minCpuUnlockSellPrice);
        orders.forEach(order => {
            const result = Game.market.deal(order.id, order.amount);
            if (result === OK) {
                const message = `Dealed CPU UNLOCK ${order.amount} for ${order.price}`;
                Game.notify(message, 0);
                console.log(message);
            }
        });
    }
    BuyPixels() {
        const orders = Game.market.getAllOrders(order => order.resourceType === PIXEL && order.type === ORDER_SELL && order.price < this._maxPixelBuyPrice);
        for (let i = 0; i < orders.length; i += 1) {
            const order = orders[i];
            const result = Game.market.deal(order.id, order.amount);
            if (result === OK) {
                const message = `Dealed PIXEL ${order.amount} for ${order.price}`;
                Game.notify(message, 60 * 24 * 7);
                console.log(message);
            }
        }
    }
    BuyMorePixels() {
        const orders = Game.market.getAllOrders(order => order.resourceType === PIXEL && order.type === ORDER_BUY && order.price < this._maxPixelBuyPrice);
        const myOrder = orders.find(order => order.id === '62d1d72a3a08f134005f736a');
        orders.sort((a, b) => b.price - a.price);
        if (orders[0].id !== myOrder.id) {
            const newPrice = orders[0].price + 1;
            Game.market.changeOrderPrice(myOrder.id, newPrice);
        }
        if (myOrder.remainingAmount < 1000) {
            Game.market.extendOrder(myOrder.id, 1000);
        }
    }
    HandleOrderEveryTick() {
        if (Game.shard.name === this._mainShard) {
            this.BuyPixels();
        }
    }
}

class GetShardVision {
    constructor() {
        var _a;
        this._mainShard = 'shard0';
        this._shardNames = ['shard0', 'shard1', 'shard2', 'shard3'];
        this._lastShardIndex = this._shardNames.indexOf((_a = global.lastShardTarget) !== null && _a !== void 0 ? _a : this._shardNames[this._shardNames.length - 1]);
    }
    SpawnCreeps() {
        const spawnShardFlag = Game.flags[this._shardNames[0]];
        if (!spawnShardFlag)
            return;
        const spawns = [Game.spawns['Spawn8'], Game.spawns['Spawn6'], Game.spawns['Spawn4'], Game.spawns['Spawn20']];
        const spawn = spawns.filter(s => s.spawning === null)[0];
        if (!spawn)
            return;
        const shardTarget = this._lastShardIndex === this._shardNames.length - 1
            ? this._shardNames[0]
            : this._shardNames[this._lastShardIndex + 1];
        const spawnResult = spawn.spawnCreep([MOVE], `${shardTarget}-${Game.time}`);
        if (spawnResult === OK || spawnResult === ERR_NAME_EXISTS) {
            global.lastShardTarget = shardTarget;
        }
    }
    MoveCreepsToTarget(creep, targetPos) {
        if (!creep.pos.inRangeTo(targetPos, 0)) {
            creep.moveTo(targetPos);
        }
    }
    Handle() {
        if (!this._shardNames.includes(Game.shard.name))
            return;
        this._shardNames.forEach((shardName, index) => {
            if (Game.time % 100 === 0 && index === 0) {
                this.SpawnCreeps();
            }
            let loggedOrders = false;
            const creeps = Object.values(Game.creeps).filter(c => c.name.includes(shardName));
            creeps.forEach(creep => {
                if (Game.shard.name === this._mainShard && shardName === this._mainShard) {
                    this.MoveCreepsToTarget(creep, Game.flags[this._mainShard].pos);
                }
                else if (Game.shard.name === this._mainShard && shardName === 'shard1') {
                    this.MoveCreepsToTarget(creep, Game.flags.shard1.pos);
                }
                else if (shardName === 'shard2') {
                    if (Game.shard.name === this._mainShard) {
                        this.MoveCreepsToTarget(creep, Game.flags.shard1.pos);
                    }
                    else if (Game.shard.name === 'shard1') {
                        this.MoveCreepsToTarget(creep, Game.flags.shard2.pos);
                    }
                }
                else if (shardName === 'shard3') {
                    if (Game.shard.name === this._mainShard) {
                        this.MoveCreepsToTarget(creep, Game.flags.shard1.pos);
                    }
                    else if (Game.shard.name === 'shard1') {
                        this.MoveCreepsToTarget(creep, Game.flags.shard2.pos);
                    }
                    else if (Game.shard.name === 'shard2') {
                        this.MoveCreepsToTarget(creep, Game.flags.shard3.pos);
                    }
                }
                if (Game.shard.name === shardName) {
                    if (!loggedOrders && Game.time % 100 === 0) {
                        console.log(JSON.stringify(Game.market.getAllOrders()));
                        if (Game.time % 1000 === 0) {
                            console.log(JSON.stringify(Game.market.getHistory()));
                        }
                        loggedOrders = true;
                    }
                    creep.say(shardName);
                }
            });
        });
    }
}

function ExecutePandaMasterCode () {
    if (Memory.me != 'PandaMaster')
        return;
    new GetShardVision().Handle();
    new Market().HandleOrderEveryTick();
    RawMemory.segments[98] = JSON.stringify(Memory.stats);
}

class InternationalManager {
    advancedGeneratePixel() {
        if (!Memory.pixelGeneration)
            return;
        if (!mmoShardNames.has(Game.shard.name))
            return;
        if (Game.cpu.bucket !== 10000)
            return;
        Game.cpu.generatePixel();
    }
    get myOrders() {
        if (this._myOrders)
            return this._myOrders;
        this._myOrders = {};
        for (const orderID in Game.market.orders) {
            const order = Game.market.orders[orderID];
            if (!this._myOrders[order.roomName]) {
                this._myOrders[order.roomName] = {
                    sell: {},
                    buy: {},
                };
            }
            if (!this._myOrders[order.roomName][order.type][order.resourceType])
                this._myOrders[order.roomName][order.type][order.resourceType] = [];
            this._myOrders[order.roomName][order.type][order.resourceType].push(order);
        }
        return this._myOrders;
    }
    get orders() {
        if (this._orders)
            return this._orders;
        this._orders = {
            buy: {},
            sell: {},
        };
        const orders = Game.market.getAllOrders();
        let order;
        for (const orderID in orders) {
            order = orders[orderID];
            this._orders[order.type][order.resourceType]
                ? this._orders[order.type][order.resourceType].push(order)
                : (this._orders[order.type][order.resourceType] = [order]);
        }
        return this._orders;
    }
    get myOrdersCount() {
        if (this._myOrdersCount)
            return this._myOrdersCount;
        return (this._myOrdersCount = Object.keys(Game.market.orders).length);
    }
    get claimRequestsByScore() {
        if (this._claimRequestsByScore)
            return this._claimRequestsByScore;
        return (this._claimRequestsByScore = Object.keys(Memory.claimRequests).sort((a, b) => Memory.claimRequests[a].score - Memory.claimRequests[b].score));
    }
    get defaultCacheAmount() {
        if (this._defaultCacheAmount)
            return this._defaultCacheAmount;
        return Math.floor((CPUBucketCapacity - Game.cpu.bucket) / cacheAmountModifier) + 1;
    }
    get marketIsFunctional() {
        if (this._marketIsFunctional !== undefined)
            return this._marketIsFunctional;
        return this._marketIsFunctional = Game.market.getHistory(RESOURCE_ENERGY).length;
    }
}
InternationalManager.prototype.run = function () {
    if (Memory.cpuLogging)
        var managerCPUStart = Game.cpu.getUsed();
    this.config();
    this.tickConfig();
    this.creepOrganizer();
    this.constructionSiteManager();
    allyManager.tickConfig();
    allyManager.getAllyRequests();
    ExecutePandaMasterCode();
    if (Memory.cpuLogging)
        customLog('International Manager', (Game.cpu.getUsed() - managerCPUStart).toFixed(2), myColors.white, myColors.lightBlue);
};
InternationalManager.prototype.getSellOrders = function (resourceType, maxPrice = getAvgPrice(resourceType) * 1.2) {
    var _a;
    const orders = ((_a = this.orders[ORDER_SELL]) === null || _a === void 0 ? void 0 : _a[resourceType]) || [];
    customLog(resourceType, maxPrice);
    return orders.filter(function (order) {
        return order.price <= maxPrice;
    });
};
InternationalManager.prototype.getBuyOrders = function (resourceType, minPrice = getAvgPrice(resourceType) * 0.8) {
    var _a;
    const orders = ((_a = this.orders[ORDER_BUY]) === null || _a === void 0 ? void 0 : _a[resourceType]) || [];
    return orders.filter(function (order) {
        return order.price >= minPrice;
    });
};
InternationalManager.prototype.advancedSellPixels = function () {
    if (!Memory.pixelSelling)
        return;
    if (Game.cpu.bucket < CPUBucketCapacity)
        return;
    const orders = Game.market.getAllOrders({ type: PIXEL });
    for (const order of orders) {
        if (order.price > getAvgPrice(PIXEL))
            continue;
        Game.market.deal(order.id, Math.min(order.amount, Game.resources[PIXEL]));
        return;
    }
};
const internationalManager = new InternationalManager();

class StatsManager {
    roomConfig(roomName, roomType) {
        if (roomType === 'commune') {
            const communeStats = {
                cl: 0,
                eih: 0,
                eiet: 0,
                eib: 0,
                eou: 0,
                eoro: 0,
                eorwr: 0,
                eob: 0,
                eoso: 0,
                eosp: 0,
                mh: 0,
                es: 0,
                cc: 0,
                cu: -1,
                rt: 0,
            };
            global.roomStats[roomName] = communeStats;
            if (!Memory.stats.rooms[roomType][roomName])
                Memory.stats.rooms[roomType][roomName] = communeStats;
            return;
        }
        const remoteStats = {
            eih: 0,
            eoro: 0,
            eob: 0,
            es: 0,
            cc: 0,
            cu: -1,
            rt: 1,
        };
        global.roomStats[roomName] = remoteStats;
        if (!Memory.stats.rooms.remote[roomName])
            Memory.stats.rooms.remote[roomName] = remoteStats;
    }
    roomPreTick(roomName, roomType) {
        this.roomConfig(roomName, roomType);
        console.log(roomName, global.roomStats[roomName].cu);
        global.roomStats[roomName].cu = Game.cpu.getUsed();
    }
    roomEndTick(roomName, roomType, room) {
        const roomStats$1 = Memory.stats.rooms[roomType][roomName];
        const globalStats = global.roomStats[roomName];
        if (Game.time % 250 === 0 && room) {
            if (roomType === 'commune') {
                roomStats$1.cl =
                    room.controller && room.controller.owner && room.controller.owner.username === Memory.me
                        ? this.round(room.controller.level + room.controller.progress / room.controller.progressTotal, 2)
                        : undefined;
                roomStats$1.es = room.findStoredResourceAmount(RESOURCE_ENERGY);
            }
            roomStats$1.cc = this.average(roomStats$1.cc, room.myCreepsAmount, 1000);
        }
        roomStats$1.cu = this.round(this.average(roomStats$1.cu, globalStats.cu >= 0 ? Game.cpu.getUsed() - globalStats.cu : 0, 1000));
    }
    internationalConfig() {
        Memory.stats = {
            lastReset: 0,
            tickLength: 0,
            lastTickTimestamp: 0,
            resources: {
                pixels: 0,
                cpuUnlocks: 0,
                accessKeys: 0,
                credits: 0,
            },
            cpu: {
                bucket: 0,
                usage: 0,
            },
            memory: {
                usage: 0,
                limit: 2097,
            },
            gcl: {
                level: 0,
                progress: 0,
                progressTotal: 0,
            },
            gpl: {
                level: 0,
                progress: 0,
                progressTotal: 0,
            },
            rooms: { commune: {}, remote: {} },
            constructionSiteCount: 0,
        };
        global.roomStats = {};
        this.internationalEndTick();
    }
    internationalPreTick() {
        console.log(global.roomStats);
        global.roomStats = {};
        console.log(Object.keys(global.roomStats).length);
    }
    internationalEndTick() {
        Memory.stats.lastReset = (Memory.stats.lastReset || 0) + 1;
        const timestamp = Date.now();
        Memory.stats.tickLength = timestamp - Memory.stats.lastTickTimestamp;
        Memory.stats.lastTickTimestamp = timestamp;
        Memory.stats.constructionSiteCount = global.constructionSitesCount || 0;
        Memory.stats.resources = {
            pixels: Game.resources[PIXEL],
            cpuUnlocks: Game.resources[CPU_UNLOCK],
            accessKeys: Game.resources[ACCESS_KEY],
            credits: Game.market.credits,
        };
        Memory.stats.cpu = {
            bucket: Game.cpu.bucket,
            usage: this.round(this.average(Memory.stats.cpu.usage, Game.cpu.getUsed(), 1000)),
        };
        Memory.stats.memory.usage = Math.floor(RawMemory.get().length / 1000);
        Memory.stats.gcl = {
            progress: Game.gcl.progress,
            progressTotal: Game.gcl.progressTotal,
            level: Game.gcl.level,
        };
        Memory.stats.gpl = {
            progress: Game.gpl.progress,
            progressTotal: Game.gpl.progressTotal,
            level: Game.gpl.level,
        };
        const globalRoomKeys = Object.keys(global.roomStats);
        const notCheckedCommuneRooms = Object.entries(Memory.stats.rooms.commune).filter(vk => !globalRoomKeys.find(k => k == vk[0]));
        const notCheckedRemoteRooms = Object.entries(Memory.stats.rooms.remote).filter(vk => !globalRoomKeys.find(k => k == vk[0]));
        notCheckedCommuneRooms.concat(notCheckedRemoteRooms).forEach(missingRoomData => {
            const roomType = Memory.rooms[missingRoomData[0]].type;
            if (!roomTypesUsedForStats.includes(roomType)) {
                delete Memory.stats.rooms.commune[missingRoomData[0]];
                delete Memory.stats.rooms.remote[missingRoomData[0]];
                delete global.roomStats[missingRoomData[0]];
            }
            else {
                this.roomConfig(missingRoomData[0], roomType);
                this.roomEndTick(missingRoomData[0], roomType);
            }
        });
        delete global.roomStats;
    }
    average(originalNumber, newNumber, averagedOverTickCount) {
        const newWeight = 1 / averagedOverTickCount;
        const originalWeight = 1 - newWeight;
        return originalNumber * originalWeight + newNumber * newWeight;
    }
    round(number, digits = 5) {
        return parseFloat(number.toFixed(digits));
    }
}
const statsManager = new StatsManager();

InternationalManager.prototype.config = function () {
    var _a, _b, _c, _d;
    if (Memory.breakingVersion < breakingVersion) {
        global.clearMemory();
        global.killAllCreeps();
    }
    if (!Memory.breakingVersion) {
        Memory.breakingVersion = breakingVersion;
        Memory.me =
            ((_b = (_a = Object.values(Game.structures)[0]) === null || _a === void 0 ? void 0 : _a.owner) === null || _b === void 0 ? void 0 : _b.username) ||
                ((_d = (_c = Object.values(Game.creeps)[0]) === null || _c === void 0 ? void 0 : _c.owner) === null || _d === void 0 ? void 0 : _d.username) ||
                'username';
        Memory.isMainShard = Object.keys(Game.spawns).length > 0 || Game.shard.name.search('shard[0-3]') === -1;
        Memory.roomVisuals = roomVisuals;
        Memory.baseVisuals = baseVisuals;
        Memory.mapVisuals = mapVisuals;
        Memory.cpuLogging = cpuLogging;
        Memory.roomStats = Game.shard.name !== 'performanceServer' ? roomStats : 2;
        Memory.allyList = allyList;
        Memory.pixelSelling = pixelSelling;
        Memory.pixelGeneration = pixelGeneration;
        Memory.tradeBlacklist = tradeBlacklist;
        Memory.autoClaim = autoClaim;
        Memory.publicRamparts = publicRamparts;
        Memory.allyTrading = allyTrading;
        Memory.ID = 0;
        Memory.constructionSites = {};
        Memory.claimRequests = {};
        Memory.attackRequests = {};
        Memory.allyCreepRequests = {};
        statsManager.internationalConfig();
    }
    if (!global.constructed) {
        RawMemory.setActiveSegments([98]);
        global.constructed = true;
        global.packedRoomNames = {};
        global.unpackedRoomNames = {};
    }
};

InternationalManager.prototype.tickConfig = function () {
    if (Memory.cpuLogging)
        var managerCPUStart = Game.cpu.getUsed();
    Memory.communes = [];
    statsManager.internationalPreTick();
    global.constructionSitesCount = Object.keys(Game.constructionSites).length;
    global.logs = ``;
    for (const roomName in Game.rooms) {
        const room = Game.rooms[roomName];
        const { controller } = room;
        room.myCreeps = {};
        for (const role of creepRoles)
            room.myCreeps[role] = [];
        room.myCreepsAmount = 0;
        room.roomObjects = {};
        room.creepsOfSourceAmount = [];
        for (const index in room.sources)
            room.creepsOfSourceAmount.push(0);
        if (!room.global.tasksWithoutResponders)
            room.global.tasksWithoutResponders = {};
        if (!room.global.tasksWithResponders)
            room.global.tasksWithResponders = {};
        if (!controller)
            continue;
        if (controller.my)
            room.memory.type = 'commune';
        if (room.memory.type != 'commune')
            continue;
        if (!controller.my) {
            room.memory.type = 'neutral';
            continue;
        }
        if (!room.memory.attackRequests)
            room.memory.attackRequests = [];
        room.spawnRequests = {};
        if (!room.memory.remotes)
            room.memory.remotes = [];
        room.creepsFromRoomWithRemote = {};
        room.remotesManager();
        Memory.communes.push(roomName);
        room.creepsFromRoom = {};
        for (const role of creepRoles)
            room.creepsFromRoom[role] = [];
        room.creepsFromRoomAmount = 0;
        if (!room.memory.stampAnchors) {
            room.memory.stampAnchors = {};
            for (const type in stamps)
                room.memory.stampAnchors[type] = [];
        }
        room.scoutTargets = new Set();
        if (!room.memory.deposits)
            room.memory.deposits = {};
    }
    let reservedGCL = Game.gcl.level;
    reservedGCL += Object.values(Memory.claimRequests).filter(request => {
        return request.responder;
    }).length;
    for (const roomName of internationalManager.claimRequestsByScore) {
        const request = Memory.claimRequests[roomName];
        if (!request)
            continue;
        if (request.abandon > 0) {
            request.abandon -= 1;
            continue;
        }
        request.abandon = undefined;
        if (request.responder)
            continue;
        if (!Memory.autoClaim)
            continue;
        if (Memory.communes.length >= reservedGCL)
            continue;
        const communes = Memory.communes.filter(roomName => {
            return !Memory.rooms[roomName].claimRequest && Game.rooms[roomName].energyCapacityAvailable >= 750;
        });
        const communeName = findClosestRoomName(roomName, communes);
        if (!communeName)
            break;
        const maxRange = 10;
        if (Game.map.getRoomLinearDistance(communeName, roomName) > maxRange ||
            advancedFindDistance(communeName, roomName, {
                keeper: Infinity,
                enemy: Infinity,
                ally: Infinity,
            }) > maxRange) {
            Memory.claimRequests[roomName].abandon = 20000;
            continue;
        }
        Memory.rooms[communeName].claimRequest = roomName;
        Memory.claimRequests[roomName].responder = communeName;
        reservedGCL += 1;
    }
    for (const roomName in Memory.allyCreepRequests) {
        const request = Memory.allyCreepRequests[roomName];
        if (request.abandon > 0) {
            request.abandon -= 1;
            continue;
        }
        request.abandon = undefined;
        if (request.responder)
            continue;
        const communes = Memory.communes.filter(roomName => {
            return !Memory.rooms[roomName].allyCreepRequest;
        });
        const communeName = findClosestRoomName(roomName, communes);
        if (!communeName)
            break;
        const maxRange = 25;
        if (Game.map.getRoomLinearDistance(communeName, roomName) > maxRange ||
            advancedFindDistance(communeName, roomName, {
                keeper: Infinity,
                enemy: Infinity,
                ally: Infinity,
            }) > maxRange) {
            Memory.allyCreepRequests[roomName].abandon = 20000;
            continue;
        }
        Memory.rooms[communeName].allyCreepRequest = roomName;
        Memory.allyCreepRequests[roomName].responder = communeName;
    }
    for (const roomName in Memory.attackRequests) {
        const request = Memory.attackRequests[roomName];
        if (request.abandon > 0) {
            request.abandon -= 1;
            continue;
        }
        if (request.responder)
            continue;
        const communes = Memory.communes.filter(roomName => {
            return !Memory.rooms[roomName].attackRequests.includes(roomName);
        });
        const communeName = findClosestRoomName(roomName, communes);
        if (!communeName)
            break;
        const maxRange = 15;
        if (Game.map.getRoomLinearDistance(communeName, roomName) > maxRange ||
            advancedFindDistance(communeName, roomName, {
                keeper: Infinity,
                enemy: Infinity,
                ally: Infinity,
            }) > maxRange) {
            Memory.attackRequests[roomName].abandon = 20000;
            continue;
        }
        Memory.rooms[communeName].attackRequests.push(roomName);
        Memory.attackRequests[roomName].responder = communeName;
    }
    if (Memory.cpuLogging)
        customLog('Tick Config', (Game.cpu.getUsed() - managerCPUStart).toFixed(2), undefined, myColors.midGrey);
};

const creepClasses = {};
class SourceHarvester extends Creep {
    constructor(creepID) {
        super(creepID);
    }
}
creepClasses.source1Harvester = SourceHarvester;
creepClasses.source2Harvester = SourceHarvester;
class Hauler extends Creep {
    constructor(creepID) {
        super(creepID);
    }
}
creepClasses.hauler = Hauler;
class ControllerUpgrader extends Creep {
    constructor(creepID) {
        super(creepID);
    }
}
creepClasses.controllerUpgrader = ControllerUpgrader;
class Builder extends Creep {
    constructor(creepID) {
        super(creepID);
    }
}
creepClasses.builder = Builder;
class Maintainer extends Creep {
    constructor(creepID) {
        super(creepID);
    }
}
creepClasses.maintainer = Maintainer;
class MineralHarvester extends Creep {
    constructor(creepID) {
        super(creepID);
    }
}
creepClasses.mineralHarvester = MineralHarvester;
class HubHauler extends Creep {
    constructor(creepID) {
        super(creepID);
    }
}
creepClasses.hubHauler = HubHauler;
class FastFiller extends Creep {
    constructor(creepID) {
        super(creepID);
    }
}
creepClasses.fastFiller = FastFiller;
class MeleeDefender extends Creep {
    constructor(creepID) {
        super(creepID);
    }
}
creepClasses.meleeDefender = MeleeDefender;
class RemoteHarvester extends Creep {
    constructor(creepID) {
        super(creepID);
    }
}
creepClasses.source1RemoteHarvester = RemoteHarvester;
creepClasses.source2RemoteHarvester = RemoteHarvester;
class RemoteHauler extends Creep {
    constructor(creepID) {
        super(creepID);
    }
}
creepClasses.remoteHauler = RemoteHauler;
class RemoteReserver extends Creep {
    constructor(creepID) {
        super(creepID);
    }
}
creepClasses.remoteReserver = RemoteReserver;
class RemoteDefender extends Creep {
    constructor(creepID) {
        super(creepID);
    }
}
creepClasses.remoteDefender = RemoteDefender;
class RemoteCoreAttacker extends Creep {
    constructor(creepID) {
        super(creepID);
    }
}
creepClasses.remoteCoreAttacker = RemoteCoreAttacker;
class RemoteDismantler extends Creep {
    constructor(creepID) {
        super(creepID);
    }
}
creepClasses.remoteDismantler = RemoteDismantler;
class Scout extends Creep {
    constructor(creepID) {
        super(creepID);
    }
}
creepClasses.scout = Scout;
class Claimer extends Creep {
    constructor(creepID) {
        super(creepID);
    }
}
creepClasses.claimer = Claimer;
class Vanguard extends Creep {
    constructor(creepID) {
        super(creepID);
    }
}
creepClasses.vanguard = Vanguard;
class AllyVanguard extends Creep {
    constructor(creepID) {
        super(creepID);
    }
}
creepClasses.allyVanguard = AllyVanguard;
class VanguardDefender extends Creep {
    constructor(creepID) {
        super(creepID);
    }
}
creepClasses.vanguardDefender = VanguardDefender;
class AntifaAssaulter extends Creep {
    constructor(creepID) {
        super(creepID);
    }
}
creepClasses.antifaAssaulter = AntifaAssaulter;
class AntifaSupporter extends Creep {
    constructor(creepID) {
        super(creepID);
    }
}
creepClasses.antifaSupporter = AntifaSupporter;

Scout.prototype.preTickManager = function () {
    if (!this.memory.scoutTarget)
        return;
    const commune = Game.rooms[this.commune];
    if (!commune)
        return;
    commune.scoutTargets.add(this.memory.scoutTarget);
};

RemoteHarvester.prototype.preTickManager = function () {
    if (!this.memory.remote)
        return;
    const role = this.role;
    if (!Memory.rooms[this.commune].remotes.includes(this.memory.remote)) {
        delete this.memory.remote;
        if (!this.findRemote())
            return;
    }
    if (Memory.rooms[this.memory.remote].needs)
        Memory.rooms[this.memory.remote].needs[remoteNeedsIndex[role]] -= this.parts.work;
    const commune = Game.rooms[this.commune];
    if (commune.creepsFromRoomWithRemote[this.memory.remote])
        commune.creepsFromRoomWithRemote[this.memory.remote][role].push(this.name);
};

RemoteHauler.prototype.preTickManager = function () {
    if (!this.memory.remote)
        return;
    const role = this.role;
    if (!Memory.rooms[this.commune].remotes.includes(this.memory.remote)) {
        delete this.memory.remote;
        if (!this.findRemote())
            return;
    }
    if (Memory.rooms[this.memory.remote].needs)
        Memory.rooms[this.memory.remote].needs[remoteNeedsIndex[role]] -= this.parts.carry;
};

RemoteReserver.prototype.preTickManager = function () {
    if (!this.memory.remote)
        return;
    const role = this.role;
    if (!Memory.rooms[this.commune].remotes.includes(this.memory.remote)) {
        delete this.memory.remote;
        if (!this.findRemote())
            return;
    }
    if (Memory.rooms[this.memory.remote].needs)
        Memory.rooms[this.memory.remote].needs[remoteNeedsIndex[role]] -= 1;
    const commune = Game.rooms[this.commune];
    if (commune.creepsFromRoomWithRemote[this.memory.remote])
        commune.creepsFromRoomWithRemote[this.memory.remote][role].push(this.name);
};

RemoteDefender.prototype.preTickManager = function () {
    if (!this.memory.remote)
        return;
    const role = this.role;
    if (!Memory.rooms[this.commune].remotes.includes(this.memory.remote)) {
        delete this.memory.remote;
        if (!this.findRemote())
            return;
    }
    if (Memory.rooms[this.memory.remote].needs) {
        Memory.rooms[this.memory.remote].needs[remoteNeedsIndex.minDamage] -= this.attackStrength;
        Memory.rooms[this.memory.remote].needs[remoteNeedsIndex.minHeal] -= this.healStrength;
    }
    const commune = Game.rooms[this.commune];
    if (commune.creepsFromRoomWithRemote[this.memory.remote])
        commune.creepsFromRoomWithRemote[this.memory.remote][role].push(this.name);
};

RemoteCoreAttacker.prototype.preTickManager = function () {
    if (!this.memory.remote)
        return;
    const role = this.role;
    if (!Memory.rooms[this.commune].remotes.includes(this.memory.remote)) {
        delete this.memory.remote;
        if (!this.findRemote())
            return;
    }
    if (Memory.rooms[this.memory.remote].needs)
        Memory.rooms[this.memory.remote].needs[remoteNeedsIndex[role]] -= 1;
    const commune = Game.rooms[this.commune];
    if (commune.creepsFromRoomWithRemote[this.memory.remote])
        commune.creepsFromRoomWithRemote[this.memory.remote][role].push(this.name);
};

RemoteDismantler.prototype.preTickManager = function () {
    if (!this.memory.remote)
        return;
    const role = this.role;
    if (!Memory.rooms[this.commune].remotes.includes(this.memory.remote)) {
        delete this.memory.remote;
        if (!this.findRemote())
            return;
    }
    if (Memory.rooms[this.memory.remote].needs)
        Memory.rooms[this.memory.remote].needs[remoteNeedsIndex[role]] -= 1;
    const commune = Game.rooms[this.commune];
    if (commune.creepsFromRoomWithRemote[this.memory.remote])
        commune.creepsFromRoomWithRemote[this.memory.remote][role].push(this.name);
};

InternationalManager.prototype.creepOrganizer = function () {
    if (Memory.cpuLogging)
        var managerCPUStart = Game.cpu.getUsed();
    for (const creepName in Memory.creeps) {
        let creep = Game.creeps[creepName];
        if (!creep) {
            delete Memory.creeps[creepName];
            continue;
        }
        const { role } = creep;
        if (!role || role.startsWith('shard'))
            continue;
        creep = Game.creeps[creepName] = new creepClasses[role](creep.id);
        const { room } = creep;
        room.myCreeps[role].push(creepName);
        room.myCreepsAmount += 1;
        if (!creep.spawning)
            room.creepPositions[pack(creep.pos)] = creep.name;
        const commune = Game.rooms[creep.commune];
        if (!commune)
            continue;
        if (!commune.controller.my) {
            creep.suicide();
            continue;
        }
        creep.preTickManager();
        creep.reservationManager();
        if (!creep.isDying())
            commune.creepsFromRoom[role].push(creepName);
        commune.creepsFromRoomAmount += 1;
    }
    if (Memory.cpuLogging)
        customLog('Creep Organizer', (Game.cpu.getUsed() - managerCPUStart).toFixed(2), undefined, myColors.midGrey);
};

Room.prototype.remotesManager = function () {
    for (let index = this.memory.remotes.length - 1; index >= 0; index -= 1) {
        const remoteName = this.memory.remotes[index];
        const remoteMemory = Memory.rooms[remoteName];
        if (remoteMemory.type !== 'remote' || remoteMemory.commune !== this.name) {
            this.memory.remotes.splice(index, 1);
            continue;
        }
        this.creepsFromRoomWithRemote[remoteName] = {};
        for (const role of spawnByRoomRemoteRoles)
            this.creepsFromRoomWithRemote[remoteName][role] = [];
        if (remoteMemory.abandoned > 0) {
            remoteMemory.abandoned -= 1;
            for (const need in remoteMemory.needs)
                remoteMemory.needs[need] = 0;
            continue;
        }
        remoteMemory.needs[remoteNeedsIndex.source1RemoteHarvester] = 3;
        remoteMemory.needs[remoteNeedsIndex.source2RemoteHarvester] = remoteMemory.source2 ? 3 : 0;
        remoteMemory.needs[remoteNeedsIndex.remoteHauler] = 0;
        remoteMemory.needs[remoteNeedsIndex.remoteReserver] = 1;
        const remote = Game.rooms[remoteName];
        const possibleReservation = this.energyCapacityAvailable >= 650;
        if (possibleReservation) {
            remoteMemory.needs[remoteNeedsIndex.source1RemoteHarvester] += 3;
            remoteMemory.needs[remoteNeedsIndex.source2RemoteHarvester] += remoteMemory.source2 ? 3 : 0;
            const isReserved = remote && remote.controller.reservation && remote.controller.reservation.username === Memory.me;
            if (isReserved &&
                remote.controller.reservation.ticksToEnd >= remoteMemory.sourceEfficacies.reduce((a, b) => a + b) * 2) {
                remoteMemory.needs[remoteNeedsIndex.remoteReserver] = 0;
            }
        }
        for (let index = 0; index < remoteMemory.sourceEfficacies.length; index += 1) {
            const income = possibleReservation ? 10 : 5;
            remoteMemory.needs[remoteNeedsIndex.remoteHauler] += findCarryPartsRequired(remoteMemory.sourceEfficacies[index], income);
        }
        if (!remote)
            continue;
        remoteMemory.needs[remoteNeedsIndex.minDamage] = 0;
        remoteMemory.needs[remoteNeedsIndex.minHeal] = 0;
        for (const enemyCreep of remote.enemyCreeps) {
            remoteMemory.needs[remoteNeedsIndex.minDamage] += enemyCreep.healStrength;
            remoteMemory.needs[remoteNeedsIndex.minHeal] += enemyCreep.attackStrength;
        }
        if (remote.structures.invaderCore.length) {
            remoteMemory.needs[remoteNeedsIndex.remoteCoreAttacker] = 1;
            if (this.controller.reservation && this.controller.reservation.username !== Memory.me) {
                remoteMemory.needs[remoteNeedsIndex.source1RemoteHarvester] = 0;
                remoteMemory.needs[remoteNeedsIndex.source2RemoteHarvester] = 0;
                remoteMemory.needs[remoteNeedsIndex.remoteHauler] = 0;
            }
        }
        else
            remoteMemory.needs[remoteNeedsIndex.remoteCoreAttacker] = 0;
        const enemyStructures = remote.find(FIND_HOSTILE_STRUCTURES).filter(function (structure) {
            return structure.structureType != STRUCTURE_INVADER_CORE;
        });
        remoteMemory.needs[remoteNeedsIndex.remoteDismantler] =
            remote.actionableWalls.length || enemyStructures.length ? 1 : 0;
    }
};

let cSiteID;
let cSite;
let cSiteAge;
InternationalManager.prototype.constructionSiteManager = function () {
    for (cSiteID in Game.constructionSites) {
        if (Memory.constructionSites[cSiteID])
            continue;
        Memory.constructionSites[cSiteID] = 0;
    }
    for (cSiteID in Memory.constructionSites) {
        cSite = Game.constructionSites[cSiteID];
        if (!cSite) {
            delete Memory.constructionSites[cSiteID];
            continue;
        }
        cSiteAge = Memory.constructionSites[cSiteID];
        if (cSiteAge > 20000 + cSiteAge * cSite.progress) {
            Game.constructionSites[cSiteID].remove();
            delete Memory.constructionSites[cSiteID];
        }
        Memory.constructionSites[cSiteID] += 1;
    }
};

InternationalManager.prototype.mapVisualsManager = function () {
    if (!Memory.mapVisuals)
        return;
    if (Memory.cpuLogging)
        var managerCPUStart = Game.cpu.getUsed();
    for (const roomName in Memory.rooms) {
        const roomMemory = Memory.rooms[roomName];
        Game.map.visual.text(roomMemory.type, new RoomPosition(2, 40, roomName), {
            align: 'right',
            fontSize: 5,
        });
        if (roomMemory.type === 'commune') {
            const room = Game.rooms[roomName];
            if (!room)
                continue;
            Game.map.visual.text(`⚡${room.findStoredResourceAmount(RESOURCE_ENERGY)}`, new RoomPosition(2, 8, roomName), {
                align: 'left',
                fontSize: 8,
            });
            if (roomMemory.claimRequest) {
                Game.map.visual.line(room.anchor || new RoomPosition(25, 25, roomName), new RoomPosition(25, 25, roomMemory.claimRequest), {
                    color: myColors.lightBlue,
                    width: 1.2,
                    opacity: 0.5,
                    lineStyle: 'dashed',
                });
            }
            if (roomMemory.allyCreepRequest) {
                Game.map.visual.line(room.anchor || new RoomPosition(25, 25, roomName), new RoomPosition(25, 25, roomMemory.allyCreepRequest), {
                    color: myColors.green,
                    width: 1.2,
                    opacity: 0.5,
                    lineStyle: 'dashed',
                });
            }
            if (roomMemory.attackRequests.length) {
                for (const requestName of roomMemory.attackRequests) {
                    Game.map.visual.line(room.anchor || new RoomPosition(25, 25, roomName), new RoomPosition(25, 25, requestName), {
                        color: myColors.red,
                        width: 1.2,
                        opacity: 0.5,
                        lineStyle: 'dashed',
                    });
                }
            }
            continue;
        }
        if (roomMemory.type === 'remote') {
            const commune = Game.rooms[roomMemory.commune];
            if (commune) {
                Game.map.visual.line(new RoomPosition(25, 25, roomName), commune.anchor || new RoomPosition(25, 25, roomMemory.commune), {
                    color: myColors.yellow,
                    width: 1.2,
                    opacity: 0.5,
                    lineStyle: 'dashed',
                });
            }
            Game.map.visual.text(`⛏️${roomMemory.sourceEfficacies.reduce((sum, el) => sum + el, 0).toString()}`, new RoomPosition(2, 8, roomName), {
                align: 'left',
                fontSize: 8,
            });
            if (roomMemory.abandoned) {
                Game.map.visual.text(`❌${roomMemory.abandoned.toString()}`, new RoomPosition(2, 16, roomName), {
                    align: 'left',
                    fontSize: 8,
                });
            }
            continue;
        }
        if (roomMemory.notClaimable) {
            Game.map.visual.circle(new RoomPosition(25, 25, roomName), {
                stroke: myColors.red,
                strokeWidth: 2,
                fill: 'transparent',
            });
            continue;
        }
    }
    for (const roomName in Memory.claimRequests) {
        Game.map.visual.text(`💵${Memory.claimRequests[roomName].score.toFixed(2)}`, new RoomPosition(2, 24, roomName), {
            align: 'left',
            fontSize: 8,
        });
    }
    if (Memory.cpuLogging)
        customLog('Map Visuals Manager', (Game.cpu.getUsed() - managerCPUStart).toFixed(2), undefined, myColors.lightGrey);
};

InternationalManager.prototype.endTickManager = function () {
    allyManager.endTickManager();
    statsManager.internationalEndTick();
    if (!Memory.isMainShard)
        return;
    for (let i = 0; i < 99; i += 1)
        console.log();
    const CPUColor = findCPUColor();
    customLog('Total CPU', `${Game.cpu.getUsed().toFixed(2)} / ${Game.cpu.limit} CPU Bucket: ${Game.cpu.bucket}`, myColors.white, CPUColor);
    console.log(global.logs);
};

const colors = {
    gray: '#555555',
    light: '#AAAAAA',
    road: '#666',
    energy: '#FFE87B',
    power: '#F53547',
    dark: '#181818',
    outline: '#8FBB93',
    speechText: '#000000',
    speechBackground: '#2ccf3b',
};
const speechSize = 0.5;
const speechFont = 'Times New Roman';
function calculateFactoryLevelGapsPoly() {
    let x = -0.08;
    let y = -0.52;
    const result = [];
    const gapAngle = 16 * (Math.PI / 180);
    const c1 = Math.cos(gapAngle);
    const s1 = Math.sin(gapAngle);
    const angle = 72 * (Math.PI / 180);
    const c2 = Math.cos(angle);
    const s2 = Math.sin(angle);
    for (let i = 0; i < 5; i += 1) {
        result.push([0.0, 0.0]);
        result.push([x, y]);
        result.push([x * c1 - y * s1, x * s1 + y * c1]);
        const tmpX = x * c2 - y * s2;
        y = x * s2 + y * c2;
        x = tmpX;
    }
    return result;
}
const factoryLevelGaps = calculateFactoryLevelGapsPoly();
RoomVisual.prototype.structure = function (x, y, type, opts = {}) {
    opts = {
        opacity: 1,
        ...opts,
    };
    switch (type) {
        case STRUCTURE_FACTORY: {
            const outline = [
                [-0.68, -0.11],
                [-0.84, -0.18],
                [-0.84, -0.32],
                [-0.44, -0.44],
                [-0.32, -0.84],
                [-0.18, -0.84],
                [-0.11, -0.68],
                [0.11, -0.68],
                [0.18, -0.84],
                [0.32, -0.84],
                [0.44, -0.44],
                [0.84, -0.32],
                [0.84, -0.18],
                [0.68, -0.11],
                [0.68, 0.11],
                [0.84, 0.18],
                [0.84, 0.32],
                [0.44, 0.44],
                [0.32, 0.84],
                [0.18, 0.84],
                [0.11, 0.68],
                [-0.11, 0.68],
                [-0.18, 0.84],
                [-0.32, 0.84],
                [-0.44, 0.44],
                [-0.84, 0.32],
                [-0.84, 0.18],
                [-0.68, 0.11],
            ];
            this.poly(outline.map(p => [p[0] + x, p[1] + y]), {
                fill: undefined,
                stroke: colors.outline,
                strokeWidth: 0.05,
                opacity: opts.opacity,
            });
            this.circle(x, y, {
                radius: 0.65,
                fill: '#232323',
                strokeWidth: 0.035,
                stroke: '#140a0a',
                opacity: opts.opacity,
            });
            const spikes = [
                [-0.4, -0.1],
                [-0.8, -0.2],
                [-0.8, -0.3],
                [-0.4, -0.4],
                [-0.3, -0.8],
                [-0.2, -0.8],
                [-0.1, -0.4],
                [0.1, -0.4],
                [0.2, -0.8],
                [0.3, -0.8],
                [0.4, -0.4],
                [0.8, -0.3],
                [0.8, -0.2],
                [0.4, -0.1],
                [0.4, 0.1],
                [0.8, 0.2],
                [0.8, 0.3],
                [0.4, 0.4],
                [0.3, 0.8],
                [0.2, 0.8],
                [0.1, 0.4],
                [-0.1, 0.4],
                [-0.2, 0.8],
                [-0.3, 0.8],
                [-0.4, 0.4],
                [-0.8, 0.3],
                [-0.8, 0.2],
                [-0.4, 0.1],
            ];
            this.poly(spikes.map(p => [p[0] + x, p[1] + y]), {
                fill: colors.gray,
                stroke: '#140a0a',
                strokeWidth: 0.04,
                opacity: opts.opacity,
            });
            this.circle(x, y, {
                radius: 0.54,
                fill: '#302a2a',
                strokeWidth: 0.04,
                stroke: '#140a0a',
                opacity: opts.opacity,
            });
            this.poly(factoryLevelGaps.map(p => [p[0] + x, p[1] + y]), {
                fill: '#140a0a',
                stroke: undefined,
                opacity: opts.opacity,
            });
            this.circle(x, y, {
                radius: 0.42,
                fill: '#140a0a',
                opacity: opts.opacity,
            });
            this.rect(x - 0.24, y - 0.24, 0.48, 0.48, {
                fill: '#3f3f3f',
                opacity: opts.opacity,
            });
            break;
        }
        case STRUCTURE_EXTENSION:
            this.circle(x, y, {
                radius: 0.5,
                fill: colors.dark,
                stroke: colors.outline,
                strokeWidth: 0.05,
                opacity: opts.opacity,
            });
            this.circle(x, y, {
                radius: 0.35,
                fill: colors.gray,
                opacity: opts.opacity,
            });
            break;
        case STRUCTURE_SPAWN:
            this.circle(x, y, {
                radius: 0.65,
                fill: colors.dark,
                stroke: '#CCCCCC',
                strokeWidth: 0.1,
                opacity: opts.opacity,
            });
            this.circle(x, y, {
                radius: 0.4,
                fill: colors.energy,
                opacity: opts.opacity,
            });
            break;
        case STRUCTURE_POWER_SPAWN:
            this.circle(x, y, {
                radius: 0.65,
                fill: colors.dark,
                stroke: colors.power,
                strokeWidth: 0.1,
                opacity: opts.opacity,
            });
            this.circle(x, y, {
                radius: 0.4,
                fill: colors.energy,
                opacity: opts.opacity,
            });
            break;
        case STRUCTURE_LINK: {
            let outer = [
                [0.0, -0.5],
                [0.4, 0.0],
                [0.0, 0.5],
                [-0.4, 0.0],
            ];
            let inner = [
                [0.0, -0.3],
                [0.25, 0.0],
                [0.0, 0.3],
                [-0.25, 0.0],
            ];
            outer = relPoly(x, y, outer);
            inner = relPoly(x, y, inner);
            outer.push(outer[0]);
            inner.push(inner[0]);
            this.poly(outer, {
                fill: colors.dark,
                stroke: colors.outline,
                strokeWidth: 0.05,
                opacity: opts.opacity,
            });
            this.poly(inner, {
                fill: colors.gray,
                stroke: undefined,
                opacity: opts.opacity,
            });
            break;
        }
        case STRUCTURE_TERMINAL: {
            let outer = [
                [0.0, -0.8],
                [0.55, -0.55],
                [0.8, 0.0],
                [0.55, 0.55],
                [0.0, 0.8],
                [-0.55, 0.55],
                [-0.8, 0.0],
                [-0.55, -0.55],
            ];
            let inner = [
                [0.0, -0.65],
                [0.45, -0.45],
                [0.65, 0.0],
                [0.45, 0.45],
                [0.0, 0.65],
                [-0.45, 0.45],
                [-0.65, 0.0],
                [-0.45, -0.45],
            ];
            outer = relPoly(x, y, outer);
            inner = relPoly(x, y, inner);
            outer.push(outer[0]);
            inner.push(inner[0]);
            this.poly(outer, {
                fill: colors.dark,
                stroke: colors.outline,
                strokeWidth: 0.05,
                opacity: opts.opacity,
            });
            this.poly(inner, {
                fill: colors.light,
                stroke: undefined,
                opacity: opts.opacity,
            });
            this.rect(x - 0.45, y - 0.45, 0.9, 0.9, {
                fill: colors.gray,
                stroke: colors.dark,
                strokeWidth: 0.1,
                opacity: opts.opacity,
            });
            break;
        }
        case STRUCTURE_LAB:
            this.circle(x, y - 0.025, {
                radius: 0.55,
                fill: colors.dark,
                stroke: colors.outline,
                strokeWidth: 0.05,
                opacity: opts.opacity,
            });
            this.circle(x, y - 0.025, {
                radius: 0.4,
                fill: colors.gray,
                opacity: opts.opacity,
            });
            this.rect(x - 0.45, y + 0.3, 0.9, 0.25, {
                fill: colors.dark,
                stroke: undefined,
                opacity: opts.opacity,
            });
            let box = [
                [-0.45, 0.3],
                [-0.45, 0.55],
                [0.45, 0.55],
                [0.45, 0.3],
            ];
            box = relPoly(x, y, box);
            this.poly(box, {
                stroke: colors.outline,
                strokeWidth: 0.05,
                opacity: opts.opacity,
            });
            break;
        case STRUCTURE_TOWER:
            this.circle(x, y, {
                radius: 0.6,
                fill: colors.dark,
                stroke: colors.outline,
                strokeWidth: 0.05,
                opacity: opts.opacity,
            });
            this.rect(x - 0.4, y - 0.3, 0.8, 0.6, {
                fill: colors.gray,
                opacity: opts.opacity,
            });
            this.rect(x - 0.2, y - 0.9, 0.4, 0.5, {
                fill: colors.light,
                stroke: colors.dark,
                strokeWidth: 0.07,
                opacity: opts.opacity,
            });
            break;
        case STRUCTURE_ROAD:
            this.circle(x, y, {
                radius: 0.175,
                fill: colors.road,
                stroke: undefined,
                opacity: opts.opacity,
            });
            if (!this.roads)
                this.roads = [];
            this.roads.push([x, y]);
            break;
        case STRUCTURE_RAMPART:
            this.circle(x, y, {
                radius: 0.5,
                fill: 'rgb(78, 104, 79)',
                stroke: 'rgb(106, 180, 107)',
                strokeWidth: 0.12,
                opacity: opts.opacity,
            });
            break;
        case STRUCTURE_WALL:
            this.circle(x, y, {
                radius: 0.4,
                fill: colors.dark,
                stroke: colors.light,
                strokeWidth: 0.05,
                opacity: opts.opacity,
            });
            break;
        case STRUCTURE_STORAGE:
            const outline1 = relPoly(x, y, [
                [-0.45, -0.55],
                [0, -0.65],
                [0.45, -0.55],
                [0.55, 0],
                [0.45, 0.55],
                [0, 0.65],
                [-0.45, 0.55],
                [-0.55, 0],
                [-0.45, -0.55],
            ]);
            this.poly(outline1, {
                stroke: colors.outline,
                strokeWidth: 0.05,
                fill: colors.dark,
                opacity: opts.opacity,
            });
            this.rect(x - 0.35, y - 0.45, 0.7, 0.9, {
                fill: colors.energy,
                opacity: opts.opacity,
            });
            break;
        case STRUCTURE_OBSERVER:
            this.circle(x, y, {
                fill: colors.dark,
                radius: 0.45,
                stroke: colors.outline,
                strokeWidth: 0.05,
                opacity: opts.opacity,
            });
            this.circle(x + 0.225, y, {
                fill: colors.outline,
                radius: 0.2,
                opacity: opts.opacity,
            });
            break;
        case STRUCTURE_NUKER:
            let outline = [
                [0, -1],
                [-0.47, 0.2],
                [-0.5, 0.5],
                [0.5, 0.5],
                [0.47, 0.2],
                [0, -1],
            ];
            outline = relPoly(x, y, outline);
            this.poly(outline, {
                stroke: colors.outline,
                strokeWidth: 0.05,
                fill: colors.dark,
                opacity: opts.opacity,
            });
            let inline = [
                [0, -0.8],
                [-0.4, 0.2],
                [0.4, 0.2],
                [0, -0.8],
            ];
            inline = relPoly(x, y, inline);
            this.poly(inline, {
                stroke: colors.outline,
                strokeWidth: 0.01,
                fill: colors.gray,
                opacity: opts.opacity,
            });
            break;
        case STRUCTURE_CONTAINER:
            this.rect(x - 0.225, y - 0.3, 0.45, 0.6, {
                fill: colors.gray,
                opacity: opts.opacity,
                stroke: colors.dark,
                strokeWidth: 0.09,
            });
            this.rect(x - 0.17, y + 0.07, 0.34, 0.2, {
                fill: colors.energy,
                opacity: opts.opacity,
            });
            break;
        default:
            this.circle(x, y, {
                fill: colors.light,
                radius: 0.35,
                stroke: colors.dark,
                strokeWidth: 0.2,
                opacity: opts.opacity,
            });
            break;
    }
    return this;
};
const dirs = [[], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
function rotate(x, y, s, c, px, py) {
    const xDelta = x * c - y * s;
    const yDelta = x * s + y * c;
    return { x: px + xDelta, y: py + yDelta };
}
function relPoly(x, y, poly) {
    return poly.map(p => {
        p[0] += x;
        p[1] += y;
        return p;
    });
}
RoomVisual.prototype.connectRoads = function (opts = {}) {
    const color = opts.color || colors.road || 'white';
    if (!this.roads)
        return this;
    this.roads.forEach(r => {
        for (let i = 1; i <= 4; i += 1) {
            const d = dirs[i];
            const c = [r[0] + d[0], r[1] + d[1]];
            const rd = _.some(this.roads, r => r[0] === c[0] && r[1] === c[1]);
            if (rd) {
                this.line(r[0], r[1], c[0], c[1], {
                    color,
                    width: 0.35,
                    opacity: opts.opacity || 1,
                });
            }
        }
    });
    return this;
};
RoomVisual.prototype.speech = function (text, x, y, opts = {}) {
    const background = opts.background ? opts.background : colors.speechBackground;
    const textcolor = opts.textcolor ? opts.textcolor : colors.speechText;
    const textstyle = opts.textstyle ? opts.textstyle : false;
    const textsize = opts.textsize ? opts.textsize : speechSize;
    const textfont = opts.textfont ? opts.textfont : speechFont;
    const opacity = opts.opacity ? opts.opacity : 1;
    let fontstring = '';
    if (textstyle) {
        fontstring = `${textstyle} `;
    }
    fontstring += `${textsize} ${textfont}`;
    let pointer = [
        [-0.2, -0.8],
        [0.2, -0.8],
        [0, -0.3],
    ];
    pointer = relPoly(x, y, pointer);
    pointer.push(pointer[0]);
    this.poly(pointer, {
        fill: background,
        stroke: background,
        opacity,
        strokeWidth: 0.0,
    });
    this.text(text, x, y - 1, {
        color: textcolor,
        backgroundColor: background,
        backgroundPadding: 0.1,
        opacity,
        font: fontstring,
    });
    return this;
};
RoomVisual.prototype.animatedPosition = function (x, y, opts = {}) {
    const color = opts.color ? opts.color : 'blue';
    const opacity = opts.opacity ? opts.opacity : 0.5;
    let radius = opts.radius ? opts.radius : 0.75;
    const frames = opts.frames ? opts.frames : 6;
    const angle = (((Game.time % frames) * 90) / frames) * (Math.PI / 180);
    const s = Math.sin(angle);
    const c = Math.cos(angle);
    const sizeMod = Math.abs((Game.time % frames) - frames / 2) / 10;
    radius += radius * sizeMod;
    const points = [
        rotate(0, -radius, s, c, x, y),
        rotate(radius, 0, s, c, x, y),
        rotate(0, radius, s, c, x, y),
        rotate(-radius, 0, s, c, x, y),
        rotate(0, -radius, s, c, x, y),
    ].map(p => [p.x, p.y]);
    this.poly(points, { stroke: color, opacity });
    return this;
};
RoomVisual.prototype.test = function test() {
    const demopos = [19, 24];
    this.clear();
    this.structure(demopos[0] + 0, demopos[1] + 0, STRUCTURE_LAB);
    this.structure(demopos[0] + 1, demopos[1] + 1, STRUCTURE_TOWER);
    this.structure(demopos[0] + 2, demopos[1] + 0, STRUCTURE_LINK);
    this.structure(demopos[0] + 3, demopos[1] + 1, STRUCTURE_TERMINAL);
    this.structure(demopos[0] + 4, demopos[1] + 0, STRUCTURE_EXTENSION);
    this.structure(demopos[0] + 5, demopos[1] + 1, STRUCTURE_SPAWN);
    return this;
};

function rampartPlanner(room) {
    if (room.memory.stampAnchors.rampart.length)
        return false;
    function generadeRoomMatrix() {
        room.tileTypes = Array(50)
            .fill(0)
            .map(x => Array(50).fill(UNWALKABLE));
        const terrain = Game.map.getRoomTerrain(room.name);
        for (let x = 0; x < roomDimensions; x += 1) {
            for (let y = 0; y < roomDimensions; y += 1) {
                if (terrain.get(x, y) === TERRAIN_MASK_WALL)
                    continue;
                room.tileTypes[x][y] = NORMAL;
                if (x === 0 || y === 0 || x === roomDimensions - 1 || y === roomDimensions - 1)
                    room.tileTypes[x][y] = EXIT;
            }
        }
        let y = 1;
        for (; y < roomDimensions - 1; y += 1) {
            if (room.tileTypes[0][y - 1] === EXIT)
                room.tileTypes[1][y] = TO_EXIT;
            if (room.tileTypes[0][y] === EXIT)
                room.tileTypes[1][y] = TO_EXIT;
            if (room.tileTypes[0][y + 1] === EXIT)
                room.tileTypes[1][y] = TO_EXIT;
            if (room.tileTypes[roomDimensions - 1][y - 1] === EXIT)
                room.tileTypes[roomDimensions - 2][y] = TO_EXIT;
            if (room.tileTypes[roomDimensions - 1][y] === EXIT)
                room.tileTypes[roomDimensions - 2][y] = TO_EXIT;
            if (room.tileTypes[roomDimensions - 1][y + 1] === EXIT)
                room.tileTypes[roomDimensions - 2][y] = TO_EXIT;
        }
        let x = 1;
        for (; x < roomDimensions - 1; x += 1) {
            if (room.tileTypes[x - 1][0] === EXIT)
                room.tileTypes[x][1] = TO_EXIT;
            if (room.tileTypes[x][0] === EXIT)
                room.tileTypes[x][1] = TO_EXIT;
            if (room.tileTypes[x + 1][0] === EXIT)
                room.tileTypes[x][1] = TO_EXIT;
            if (room.tileTypes[x - 1][roomDimensions - 1] === EXIT)
                room.tileTypes[x][roomDimensions - 2] = TO_EXIT;
            if (room.tileTypes[x][roomDimensions - 1] === EXIT)
                room.tileTypes[x][roomDimensions - 2] = TO_EXIT;
            if (room.tileTypes[x + 1][roomDimensions - 1] === EXIT)
                room.tileTypes[x][roomDimensions - 2] = TO_EXIT;
        }
        y = 1;
        for (; y < roomDimensions - 1; y += 1) {
            room.tileTypes[0][y] === UNWALKABLE;
            room.tileTypes[roomDimensions - 1][y] === UNWALKABLE;
        }
        x = 1;
        for (; x < roomDimensions - 1; x += 1) {
            room.tileTypes[x][0] === UNWALKABLE;
            room.tileTypes[x][roomDimensions - 1] === UNWALKABLE;
        }
    }
    class Graph {
        constructor(menge_v) {
            this.v = menge_v;
            this.level = Array(menge_v);
            this.edges = Array(menge_v)
                .fill(0)
                .map(x => []);
        }
    }
    Graph.prototype.New_edge = function (u, v, c) {
        this.edges[u].push({ v, r: this.edges[v].length, c, f: 0 });
        this.edges[v].push({ v: u, r: this.edges[u].length - 1, c: 0, f: 0 });
    };
    Graph.prototype.Bfs = function (s, t) {
        if (t >= this.v)
            return false;
        this.level.fill(-1);
        this.level[s] = 0;
        const q = [];
        q.push(s);
        let u = 0;
        let edge = null;
        while (q.length) {
            u = q.splice(0, 1)[0];
            let i = 0;
            const imax = this.edges[u].length;
            for (; i < imax; i += 1) {
                edge = this.edges[u][i];
                if (this.level[edge.v] < 0 && edge.f < edge.c) {
                    this.level[edge.v] = this.level[u] + 1;
                    q.push(edge.v);
                }
            }
        }
        return this.level[t] >= 0;
    };
    Graph.prototype.Dfsflow = function (u, f, t, c) {
        if (u === t)
            return f;
        let edge = null;
        let flow_till_here = 0;
        let flow_to_t = 0;
        while (c[u] < this.edges[u].length) {
            edge = this.edges[u][c[u]];
            if (this.level[edge.v] === this.level[u] + 1 && edge.f < edge.c) {
                flow_till_here = Math.min(f, edge.c - edge.f);
                flow_to_t = this.Dfsflow(edge.v, flow_till_here, t, c);
                if (flow_to_t > 0) {
                    edge.f += flow_to_t;
                    this.edges[edge.v][edge.r].f -= flow_to_t;
                    return flow_to_t;
                }
            }
            c[u] += 1;
        }
        return 0;
    };
    Graph.prototype.Bfsthecut = function (s) {
        const e_in_cut = [];
        this.level.fill(-1);
        this.level[s] = 1;
        const q = [];
        q.push(s);
        let u = 0;
        let edge = null;
        while (q.length) {
            u = q.splice(0, 1)[0];
            let i = 0;
            const imax = this.edges[u].length;
            for (; i < imax; i += 1) {
                edge = this.edges[u][i];
                if (edge.f < edge.c) {
                    if (this.level[edge.v] < 1) {
                        this.level[edge.v] = 1;
                        q.push(edge.v);
                    }
                }
                if (edge.f === edge.c && edge.c > 0) {
                    edge.u = u;
                    e_in_cut.push(edge);
                }
            }
        }
        const min_cut = [];
        let i = 0;
        const imax = e_in_cut.length;
        for (; i < imax; i += 1) {
            if (this.level[e_in_cut[i].v] === -1)
                min_cut.push(e_in_cut[i].u);
        }
        return min_cut;
    };
    Graph.prototype.Calcmincut = function (s, t) {
        if (s === t)
            return -1;
        let returnValue = 0;
        while (this.Bfs(s, t) === true) {
            const count = Array(this.v + 1).fill(0);
            let flow = 0;
            do {
                flow = this.Dfsflow(s, Number.MAX_VALUE, t, count);
                if (flow > 0)
                    returnValue += flow;
            } while (flow);
        }
        return returnValue;
    };
    function createGraph(rects) {
        generadeRoomMatrix();
        for (const rect of rects) {
            for (let x = rect.x1; x <= rect.x2; x += 1) {
                for (let y = rect.y1; y <= rect.y2; y += 1) {
                    if (x === rect.x1 || x === rect.x2 || y === rect.y1 || y === rect.y2) {
                        if (room.tileTypes[x][y] === NORMAL)
                            room.tileTypes[x][y] = PROTECTED;
                        continue;
                    }
                    room.tileTypes[x][y] = UNWALKABLE;
                }
            }
        }
        if (Memory.roomVisuals) {
            for (let x = 0; x < roomDimensions; x += 1) {
                for (let y = 0; y < roomDimensions; y += 1) {
                    if (room.tileTypes[x][y] === NORMAL) {
                        room.visual.rect(x - 0.5, y - 0.5, 1, 1, {
                            fill: '#e8e863',
                            opacity: 0.3,
                        });
                        continue;
                    }
                    if (room.tileTypes[x][y] === PROTECTED) {
                        room.visual.rect(x - 0.5, y - 0.5, 1, 1, {
                            fill: '#61975E',
                            opacity: 0.3,
                        });
                        continue;
                    }
                }
            }
        }
        const g = new Graph(2 * 50 * 50 + 2);
        const infini = Number.MAX_VALUE;
        const surr = [
            [0, -1],
            [-1, -1],
            [-1, 0],
            [-1, 1],
            [0, 1],
            [1, 1],
            [1, 0],
            [1, -1],
        ];
        const source = 2 * 50 * 50;
        const sink = 2 * 50 * 50 + 1;
        let dx = 0;
        let dy = 0;
        for (let x = 1; x < roomDimensions - 1; x += 1) {
            for (let y = 1; y < roomDimensions - 1; y += 1) {
                const top = y * 50 + x;
                const bot = top + 2500;
                if (room.tileTypes[x][y] === NORMAL) {
                    g.New_edge(top, bot, 1);
                    for (let i = 0; i < 8; i += 1) {
                        dx = x + surr[i][0];
                        dy = y + surr[i][1];
                        if (room.tileTypes[dx][dy] === NORMAL || room.tileTypes[dx][dy] === TO_EXIT)
                            g.New_edge(bot, dy * 50 + dx, infini);
                    }
                    continue;
                }
                if (room.tileTypes[x][y] === PROTECTED) {
                    g.New_edge(source, top, infini);
                    g.New_edge(top, bot, 1);
                    for (let i = 0; i < 8; i += 1) {
                        dx = x + surr[i][0];
                        dy = y + surr[i][1];
                        if (room.tileTypes[dx][dy] === NORMAL || room.tileTypes[dx][dy] === TO_EXIT)
                            g.New_edge(bot, dy * 50 + dx, infini);
                    }
                    continue;
                }
                if (room.tileTypes[x][y] === TO_EXIT) {
                    g.New_edge(top, sink, infini);
                    continue;
                }
            }
        }
        return g;
    }
    function deleteTilesToDeadEnds(cut_tiles_array) {
        for (let i = cut_tiles_array.length - 1; i >= 0; i -= 1)
            room.tileTypes[cut_tiles_array[i].x][cut_tiles_array[i].y] = UNWALKABLE;
        const unvisited_pos = [];
        let y = 0;
        for (; y < roomDimensions - 1; y += 1) {
            if (room.tileTypes[1][y] === TO_EXIT)
                unvisited_pos.push(50 * y + 1);
            if (room.tileTypes[48][y] === TO_EXIT)
                unvisited_pos.push(50 * y + 48);
        }
        let x = 0;
        for (; x < roomDimensions - 1; x += 1) {
            if (room.tileTypes[x][1] === TO_EXIT)
                unvisited_pos.push(50 + x);
            if (room.tileTypes[x][48] === TO_EXIT)
                unvisited_pos.push(2400 + x);
        }
        const surr = [
            [0, -1],
            [-1, -1],
            [-1, 0],
            [-1, 1],
            [0, 1],
            [1, 1],
            [1, 0],
            [1, -1],
        ];
        let index;
        let dx;
        let dy;
        while (unvisited_pos.length > 0) {
            index = unvisited_pos.pop();
            x = index % 50;
            y = Math.floor(index / 50);
            for (let i = 0; i < 8; i += 1) {
                dx = x + surr[i][0];
                dy = y + surr[i][1];
                if (room.tileTypes[dx][dy] === NORMAL) {
                    unvisited_pos.push(50 * dy + dx);
                    room.tileTypes[dx][dy] = TO_EXIT;
                }
            }
        }
        let leads_to_exit = false;
        for (let i = cut_tiles_array.length - 1; i >= 0; i -= 1) {
            leads_to_exit = false;
            x = cut_tiles_array[i].x;
            y = cut_tiles_array[i].y;
            for (let i = 0; i < 8; i += 1) {
                dx = x + surr[i][0];
                dy = y + surr[i][1];
                if (room.tileTypes[dx][dy] === TO_EXIT) {
                    leads_to_exit = true;
                }
            }
            if (!leads_to_exit)
                cut_tiles_array.splice(i, 1);
        }
    }
    function GetCutTiles(rects) {
        const graph = createGraph(rects);
        if (!graph)
            return [];
        const source = 2 * 50 * 50;
        const sink = 2 * 50 * 50 + 1;
        const positions = [];
        const packedPositions = [];
        if (graph.Calcmincut(source, sink) > 0) {
            const cutEdges = graph.Bfsthecut(source);
            for (let i = 0; i < cutEdges.length; i += 1) {
                const packedCoord = cutEdges[i];
                const x = packedCoord % 50;
                const y = Math.floor(packedCoord / 50);
                positions.push({ x, y });
                packedPositions.push(pack({ x, y }));
            }
        }
        if (positions.length > 0)
            deleteTilesToDeadEnds(positions);
        return packedPositions;
    }
    const protectionRects = [];
    const { controller } = room;
    protectionRects.push({
        x1: Math.max(Math.min(controller.pos.x - 1, roomDimensions - 2), 2),
        y1: Math.max(Math.min(controller.pos.y - 1, roomDimensions - 2), 2),
        x2: Math.max(Math.min(controller.pos.x + 1, roomDimensions - 2), 2),
        y2: Math.max(Math.min(controller.pos.y + 1, roomDimensions - 2), 2),
    });
    const centerUpgradePos = room.get('centerUpgradePos');
    protectionRects.push({
        x1: Math.max(Math.min(centerUpgradePos.x - 3, roomDimensions - 2), 2),
        y1: Math.max(Math.min(centerUpgradePos.y - 3, roomDimensions - 2), 2),
        x2: Math.max(Math.min(centerUpgradePos.x + 3, roomDimensions - 2), 2),
        y2: Math.max(Math.min(centerUpgradePos.y + 3, roomDimensions - 2), 2),
    });
    const { stampAnchors } = room.memory;
    for (const stampType in stampAnchors) {
        const { protectionOffset } = stamps[stampType];
        for (const packedStampAnchor of stampAnchors[stampType]) {
            const stampAnchor = unpackAsPos(packedStampAnchor);
            protectionRects.push({
                x1: Math.max(Math.min(stampAnchor.x - protectionOffset, roomDimensions - 2), 2),
                y1: Math.max(Math.min(stampAnchor.y - protectionOffset, roomDimensions - 2), 2),
                x2: Math.max(Math.min(stampAnchor.x + protectionOffset, roomDimensions - 2), 2),
                y2: Math.max(Math.min(stampAnchor.y + protectionOffset, roomDimensions - 2), 2),
            });
        }
    }
    !room.memory.stampAnchors.rampart.length;
    const rampartPositions = room.memory.stampAnchors.rampart.length
        ? room.memory.stampAnchors.rampart
        : GetCutTiles(protectionRects);
    const roadCM = room.get('roadCM');
    const rampartPlans = room.rampartPlans;
    for (const packedPos of rampartPositions) {
        const pos = unpackAsPos(packedPos);
        roadCM.set(pos.x, pos.y, 1);
        rampartPlans.set(pos.x, pos.y, 1);
    }
    const hubAnchor = unpackAsRoomPos(room.memory.stampAnchors.hub[0], room.name);
    const groupedRampartPositions = room.groupRampartPositions(rampartPositions, rampartPlans);
    for (const group of groupedRampartPositions) {
        const closestPosToAnchor = hubAnchor.findClosestByPath(group, {
            ignoreCreeps: true,
            ignoreDestructibleStructures: true,
            ignoreRoads: true,
        });
        const path = room.advancedFindPath({
            origin: closestPosToAnchor,
            goal: { pos: hubAnchor, range: 2 },
            weightCostMatrixes: [roadCM],
        });
        for (const pos of path)
            roadCM.set(pos.x, pos.y, 1);
        let onboardingIndex = 0;
        while (path[onboardingIndex]) {
            const onboardingPos = path[onboardingIndex];
            if (rampartPlans.get(onboardingPos.x, onboardingPos.y) === 1) {
                onboardingIndex += 1;
                continue;
            }
            roadCM.set(onboardingPos.x, onboardingPos.y, 1);
            rampartPlans.set(onboardingPos.x, onboardingPos.y, 1);
            break;
        }
    }
    for (const packedStampAnchor of stampAnchors.tower) {
        const stampAnchor = unpackAsPos(packedStampAnchor);
        rampartPlans.set(stampAnchor.x, stampAnchor.y, 1);
    }
    rampartPlans.set(room.anchor.x - 2, room.anchor.y - 1, 1);
    rampartPlans.set(room.anchor.x + 2, room.anchor.y - 1, 1);
    rampartPlans.set(room.anchor.x, room.anchor.y + 2, 1);
    rampartPlans.set(hubAnchor.x + 1, hubAnchor.y - 1, 1);
    rampartPlans.set(hubAnchor.x - 1, hubAnchor.y + 1, 1);
    return true;
}

function basePlanner(room) {
    const baseCM = room.get('baseCM');
    const roadCM = room.get('roadCM');
    const terrain = room.getTerrain();
    if (!room.memory.stampAnchors) {
        room.memory.stampAnchors = {};
        for (const type in stamps)
            room.memory.stampAnchors[type] = [];
    }
    function recordAdjacentPositions(x, y, range, weight) {
        const adjacentPositions = findPositionsInsideRect(x - range, y - range, x + range, y + range);
        for (const adjacentPos of adjacentPositions) {
            if (baseCM.get(adjacentPos.x, adjacentPos.y) > 0)
                continue;
            baseCM.set(adjacentPos.x, adjacentPos.y, weight || 255);
        }
    }
    recordAdjacentPositions(room.controller.pos.x, room.controller.pos.y, 2);
    for (const pos of room.get('mineralHarvestPositions')) {
        baseCM.set(pos.x, pos.y, 255);
    }
    const sources = room.sources;
    for (const source of sources)
        recordAdjacentPositions(source.pos.x, source.pos.y, 2);
    const avgSourcePos = sources.length > 1 ? findAvgBetweenPosotions(sources[0].pos, sources[1].pos) : sources[0].pos;
    const avgControllerSourcePos = findAvgBetweenPosotions(room.controller.pos, avgSourcePos);
    const controllerAdjacentPositions = findPositionsInsideRect(room.controller.pos.x - 3, room.controller.pos.y - 3, room.controller.pos.x + 3, room.controller.pos.y + 3);
    for (const pos of controllerAdjacentPositions)
        baseCM.set(pos.x, pos.y, 255);
    let stamp;
    let newStampAnchors;
    let packedStampAnchor;
    let stampAnchor;
    let structureType;
    let pos;
    let x;
    let y;
    function planStamp(opts) {
        stamp = stamps[opts.stampType];
        newStampAnchors = [];
        while (opts.count > 0) {
            opts.count -= 1;
            if (room.memory.stampAnchors[opts.stampType][opts.count]) {
                for (packedStampAnchor of room.memory.stampAnchors[opts.stampType]) {
                    stampAnchor = unpackAsPos(packedStampAnchor);
                    for (structureType in stamp.structures) {
                        for (pos of stamp.structures[structureType]) {
                            x = pos.x + stampAnchor.x - stamp.offset;
                            y = pos.y + stampAnchor.y - stamp.offset;
                            if (structureType === STRUCTURE_ROAD) {
                                roadCM.set(x, y, 1);
                                continue;
                            }
                            baseCM.set(x, y, 255);
                            roadCM.set(x, y, 255);
                        }
                    }
                }
                continue;
            }
            const distanceCM = opts.normalDT ? room.distanceTransform(baseCM) : room.diagonalDistanceTransform(baseCM);
            stampAnchor = room.findClosestPosOfValue({
                CM: distanceCM,
                startPos: opts.anchorOrient,
                requiredValue: stamp.size,
                initialWeight: opts.initialWeight || 0,
                adjacentToRoads: opts.adjacentToRoads,
                roadCM: opts.adjacentToRoads ? roadCM : undefined,
            });
            if (!stampAnchor)
                return false;
            newStampAnchors.push(pack(stampAnchor));
            for (structureType in stamp.structures) {
                for (pos of stamp.structures[structureType]) {
                    x = pos.x + stampAnchor.x - stamp.offset;
                    y = pos.y + stampAnchor.y - stamp.offset;
                    if (structureType === STRUCTURE_ROAD) {
                        roadCM.set(x, y, 1);
                        continue;
                    }
                    baseCM.set(x, y, 255);
                    roadCM.set(x, y, 255);
                }
            }
        }
        room.memory.stampAnchors[opts.stampType] = room.memory.stampAnchors[opts.stampType].concat(newStampAnchors);
        return true;
    }
    if (!planStamp({
        stampType: 'fastFiller',
        count: 1,
        anchorOrient: avgControllerSourcePos,
        normalDT: true,
    }))
        return false;
    if (!room.memory.stampAnchors.fastFiller.length) {
        room.memory.notClaimable = true;
        return false;
    }
    for (const pos of controllerAdjacentPositions) {
        if (terrain.get(pos.x, pos.y) == TERRAIN_MASK_WALL)
            continue;
        baseCM.set(pos.x, pos.y, 0);
    }
    const centerUpgadePos = room.get('centerUpgradePos');
    if (!centerUpgadePos)
        return false;
    const upgradePositions = room.get('upgradePositions');
    for (const upgradePos of upgradePositions) {
        baseCM.set(upgradePos.x, upgradePos.y, 255);
        roadCM.set(upgradePos.x, upgradePos.y, 20);
    }
    if (!planStamp({
        stampType: 'hub',
        count: 1,
        anchorOrient: room.anchor,
        normalDT: true,
    }))
        return false;
    const hubAnchor = unpackAsRoomPos(room.memory.stampAnchors.hub[0], room.name);
    const fastFillerHubAnchor = findAvgBetweenPosotions(room.anchor, hubAnchor);
    const closestUpgradePos = upgradePositions[0];
    roadCM.set(closestUpgradePos.x, closestUpgradePos.y, 5);
    let path = [];
    if (!planStamp({
        stampType: 'extensions',
        count: 7,
        anchorOrient: fastFillerHubAnchor,
    }))
        return false;
    for (const extensionsAnchor of room.memory.stampAnchors.extensions) {
        path = room.advancedFindPath({
            origin: unpackAsRoomPos(extensionsAnchor, room.name),
            goal: { pos: hubAnchor, range: 2 },
            weightCostMatrixes: [roadCM],
        });
        for (const pos of path) {
            roadCM.set(pos.x, pos.y, 1);
        }
    }
    if (!planStamp({
        stampType: 'labs',
        count: 1,
        anchorOrient: fastFillerHubAnchor,
    }))
        return false;
    path = room.advancedFindPath({
        origin: hubAnchor,
        goal: { pos: room.anchor, range: 3 },
        weightCostMatrixes: [roadCM],
    });
    for (const pos of path) {
        roadCM.set(pos.x, pos.y, 1);
    }
    path = room.advancedFindPath({
        origin: centerUpgadePos,
        goal: { pos: hubAnchor, range: 2 },
        weightCostMatrixes: [roadCM],
    });
    for (const pos of path) {
        roadCM.set(pos.x, pos.y, 1);
    }
    for (const index in sources) {
        const closestSourcePos = room.sourcePositions[index][0];
        roadCM.set(closestSourcePos.x, closestSourcePos.y, 255);
    }
    for (const index in sources) {
        const closestSourcePos = room.sourcePositions[index][0];
        if (!room.memory.stampAnchors.container.includes(pack(closestSourcePos))) {
            room.memory.stampAnchors.container.push(pack(closestSourcePos));
        }
        for (const index2 in room.sources) {
            if (index === index2)
                continue;
            for (const pos of room.sourcePositions[index2])
                roadCM.set(pos.x, pos.y, 10);
        }
        path = room.advancedFindPath({
            origin: closestSourcePos,
            goal: { pos: room.anchor, range: 3 },
            weightCostMatrixes: [roadCM],
        });
        for (const pos of path)
            roadCM.set(pos.x, pos.y, 1);
        path = room.advancedFindPath({
            origin: closestSourcePos,
            goal: { pos: closestUpgradePos, range: 1 },
            weightCostMatrixes: [roadCM],
        });
        for (const pos of path)
            roadCM.set(pos.x, pos.y, 1);
    }
    path = room.advancedFindPath({
        origin: unpackAsRoomPos(room.memory.stampAnchors.labs[0], room.name),
        goal: { pos: hubAnchor, range: 2 },
        weightCostMatrixes: [roadCM],
    });
    for (const pos of path)
        roadCM.set(pos.x, pos.y, 1);
    const mineralHarvestPos = room.get('closestMineralHarvestPos');
    roadCM.set(mineralHarvestPos.x, mineralHarvestPos.y, 255);
    path = room.advancedFindPath({
        origin: mineralHarvestPos,
        goal: { pos: hubAnchor, range: 2 },
        weightCostMatrixes: [roadCM],
    });
    for (const pos of path)
        roadCM.set(pos.x, pos.y, 1);
    if (!room.memory.stampAnchors.extractor.length)
        room.memory.stampAnchors.extractor.push(pack(room.mineral.pos));
    for (let x = 0; x < roomDimensions; x += 1) {
        for (let y = 0; y < roomDimensions; y += 1) {
            if (roadCM.get(x, y) === 1)
                baseCM.set(x, y, 255);
        }
    }
    baseCM.set(closestUpgradePos.x, closestUpgradePos.y, 255);
    if (!planStamp({
        stampType: 'tower',
        count: 6,
        anchorOrient: fastFillerHubAnchor,
        adjacentToRoads: true,
    }))
        return false;
    rampartPlanner(room);
    const rampartPlans = room.rampartPlans;
    for (let x = 0; x < roomDimensions; x += 1) {
        for (let y = 0; y < roomDimensions; y += 1) {
            if (roadCM.get(x, y) === 1)
                baseCM.set(x, y, 255);
        }
    }
    let extraExtensionsAmount = CONTROLLER_STRUCTURES.extension[8] -
        stamps.fastFiller.structures.extension.length -
        stamps.hub.structures.extension.length -
        room.memory.stampAnchors.extensions.length * stamps.extensions.structures.extension.length -
        room.memory.stampAnchors.extension.length -
        room.memory.stampAnchors.sourceExtension.length;
    if (room.memory.stampAnchors.sourceLink.length + room.memory.stampAnchors.sourceExtension.length === 0) {
        for (const index in sources) {
            let sourceHasLink = false;
            const closestSourcePos = room.sourcePositions[index][0];
            const isProtected = room.tileTypes[closestSourcePos.x][closestSourcePos.y] === PROTECTED;
            const OGPositions = new Map();
            for (const pos of room.sourcePositions[index]) {
                if (arePositionsEqual(closestSourcePos, pos))
                    continue;
                OGPositions.set(pos, roadCM.get(pos.x, pos.y));
                roadCM.set(pos.x, pos.y, 0);
            }
            if (!isProtected)
                rampartPlans.set(closestSourcePos.x, closestSourcePos.y, 1);
            const adjacentPositions = findPositionsInsideRect(closestSourcePos.x - 1, closestSourcePos.y - 1, closestSourcePos.x + 1, closestSourcePos.y + 1);
            adjacentPositions.sort(function (a, b) {
                return getRange(a.x, hubAnchor.x, a.y, hubAnchor.y) - getRange(b.x, hubAnchor.x, b.y, hubAnchor.y);
            });
            for (const pos of adjacentPositions) {
                if (roadCM.get(pos.x, pos.y) > 0)
                    continue;
                if (rampartPlans.get(pos.x, pos.y) > 0)
                    continue;
                if (terrain.get(pos.x, pos.y) === TERRAIN_MASK_WALL)
                    continue;
                if (room.tileTypes[pos.x][pos.y] === TO_EXIT)
                    continue;
                baseCM.set(pos.x, pos.y, 255);
                roadCM.set(pos.x, pos.y, 255);
                if (!sourceHasLink) {
                    room.memory.stampAnchors.sourceLink.push(pack(pos));
                    if (!isProtected)
                        rampartPlans.set(pos.x, pos.y, 1);
                    sourceHasLink = true;
                    continue;
                }
                room.memory.stampAnchors.sourceExtension.push(pack(pos));
                extraExtensionsAmount -= 1;
                continue;
            }
            for (const [pos, value] of OGPositions)
                roadCM.set(pos.x, pos.y, value);
        }
    }
    if (!room.memory.stampAnchors.rampart.length) {
        for (let x = 0; x < roomDimensions; x += 1) {
            for (let y = 0; y < roomDimensions; y += 1) {
                if (rampartPlans.get(x, y) === 1)
                    room.memory.stampAnchors.rampart.push(pack({ x, y }));
            }
        }
    }
    if (!planStamp({
        stampType: 'extension',
        count: extraExtensionsAmount,
        anchorOrient: hubAnchor,
        adjacentToRoads: true,
    }))
        return false;
    if (!planStamp({
        stampType: 'observer',
        count: 1,
        anchorOrient: fastFillerHubAnchor,
    }))
        return false;
    for (let x = 0; x < roomDimensions; x += 1) {
        for (let y = 0; y < roomDimensions; y += 1) {
            const packedPos = x * roomDimensions + y;
            if (room.rampartPlans.get(x, y) === 1)
                room.memory.stampAnchors.rampart.push(packedPos);
            if (!room.memory.stampAnchors.road.includes(packedPos) && roadCM.get(x, y) === 1)
                room.memory.stampAnchors.road.push(packedPos);
        }
    }
    room.memory.planned = true;
    return true;
}

class RoomCacheObject {
    constructor(opts) {
        const roomObject = this;
        for (const propertyName in opts)
            roomObject[propertyName] = opts[propertyName];
        roomObject.room.roomObjects[roomObject.name] = roomObject;
    }
}
RoomCacheObject.prototype.formatValue = function () {
    const roomObject = this;
    const { room } = roomObject;
    if (roomObject.valueType === 'id') {
        roomObject.value = findObjectWithID(roomObject.value);
        return;
    }
    if (roomObject.valueType === 'pos') {
        if (!roomObject.value)
            return;
        roomObject.value = new RoomPosition(roomObject.value.x, roomObject.value.y, room.name);
    }
};
RoomCacheObject.prototype.getCachedValue = function () {
    const roomObject = this;
    const { room } = roomObject;
    if (roomObject.cacheType === 'memory') {
        const cachedValue = room.memory[roomObject.name];
        if (!cachedValue)
            return false;
        roomObject.value = cachedValue;
        return true;
    }
    if (roomObject.cacheType === 'global') {
        const cachedRoomObject = room.global[roomObject.name];
        if (!cachedRoomObject)
            return false;
        if (cachedRoomObject.lastCache + roomObject.cacheAmount <= Game.time) {
            delete room.global[roomObject.name];
            return false;
        }
        roomObject.value = cachedRoomObject.value;
        return true;
    }
    return false;
};
RoomCacheObject.prototype.getValue = function () {
    const roomObject = this;
    if (roomObject.getCachedValue()) {
        roomObject.formatValue();
        if (roomObject.value)
            return roomObject.value;
    }
    roomObject.value = roomObject.valueConstructor();
    roomObject.cache();
    roomObject.formatValue();
    return roomObject.value;
};
RoomCacheObject.prototype.cache = function () {
    const roomObject = this;
    const { room } = roomObject;
    room.roomObjects[roomObject.name] = roomObject;
    if (roomObject.cacheType === 'memory') {
        room.memory[roomObject.name] = roomObject.value;
        return;
    }
    if (roomObject.cacheType === 'global') {
        const roomObjectCopy = new RoomCacheObject({
            name: roomObject.name,
            valueType: roomObject.valueType,
            cacheType: roomObject.cacheType,
            cacheAmount: roomObject.cacheAmount,
            room,
            valueConstructor: undefined,
        });
        roomObjectCopy.lastCache = Game.time;
        roomObjectCopy.value = roomObject.value;
        room.global[roomObject.name] = roomObjectCopy;
    }
};

Room.prototype.get = function (roomObjectName) {
    const room = this;
    function generateTerrainCM() {
        const terrain = room.getTerrain();
        const terrainCM = new PathFinder.CostMatrix();
        for (let x = 0; x < roomDimensions; x += 1) {
            for (let y = 0; y < roomDimensions; y += 1) {
                const terrainValue = terrain.get(x, y);
                if (terrainValue === TERRAIN_MASK_WALL) {
                    terrainCM.set(x, y, 255);
                }
            }
        }
        return terrainCM;
    }
    new RoomCacheObject({
        name: 'terrainCM',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor: generateTerrainCM,
    });
    function generateBaseCM() {
        const baseCM = room.roomObjects.terrainCM.getValue().clone();
        const exits = room.find(FIND_EXIT);
        for (const pos of exits) {
            baseCM.set(pos.x, pos.y, 255);
            const adjacentPositions = findPositionsInsideRect(pos.x - 2, pos.y - 2, pos.x + 2, pos.y + 2);
            for (const adjacentPos of adjacentPositions) {
                baseCM.set(adjacentPos.x, adjacentPos.y, 255);
            }
        }
        return baseCM;
    }
    new RoomCacheObject({
        name: 'baseCM',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor: generateBaseCM,
    });
    new RoomCacheObject({
        name: 'roadCM',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor: () => {
            return new PathFinder.CostMatrix();
        },
    });
    new RoomCacheObject({
        name: 'source1',
        valueType: 'id',
        cacheType: 'memory',
        room,
        valueConstructor() {
            const source = room.find(FIND_SOURCES)[0];
            if (source)
                return source.id;
            return false;
        },
    });
    new RoomCacheObject({
        name: 'source2',
        valueType: 'id',
        cacheType: 'memory',
        room,
        valueConstructor() {
            const source = room.find(FIND_SOURCES)[1];
            if (source)
                return source.id;
            return false;
        },
    });
    function findHarvestPositions(source) {
        if (!source)
            return [];
        const harvestPositions = [];
        const terrain = Game.map.getRoomTerrain(room.name);
        const adjacentPositions = findPositionsInsideRect(source.pos.x - 1, source.pos.y - 1, source.pos.x + 1, source.pos.y + 1);
        for (const pos of adjacentPositions) {
            if (terrain.get(pos.x, pos.y) === TERRAIN_MASK_WALL)
                continue;
            harvestPositions.push(new RoomPosition(pos.x, pos.y, room.name));
        }
        return harvestPositions;
    }
    function findClosestHarvestPos(harvestPositions) {
        if (!room.anchor)
            return;
        return room.anchor.findClosestByPath(harvestPositions, {
            ignoreCreeps: true,
            ignoreDestructibleStructures: true,
            ignoreRoads: true,
        });
    }
    new RoomCacheObject({
        name: 'mineralHarvestPositions',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor() {
            return findHarvestPositions(room.mineral);
        },
    });
    new RoomCacheObject({
        name: 'closestMineralHarvestPos',
        valueType: 'pos',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor() {
            return findClosestHarvestPos(room.roomObjects.mineralHarvestPositions.getValue());
        },
    });
    function findCenterUpgradePos() {
        if (!room.anchor)
            return false;
        const distanceCM = room.distanceTransform(undefined, false, room.controller.pos.x - 2, room.controller.pos.y - 2, room.controller.pos.x + 2, room.controller.pos.y + 2);
        return room.findClosestPosOfValue({
            CM: distanceCM,
            startPos: room.anchor,
            requiredValue: 2,
            reduceIterations: 1,
        });
    }
    new RoomCacheObject({
        name: 'centerUpgradePos',
        valueType: 'pos',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor: findCenterUpgradePos,
    });
    function findUpgradePositions() {
        const centerUpgradePos = room.roomObjects.centerUpgradePos.getValue();
        if (!centerUpgradePos)
            return [];
        if (!room.anchor)
            return [];
        const upgradePositions = [];
        const terrain = Game.map.getRoomTerrain(room.name);
        const adjacentPositions = findPositionsInsideRect(centerUpgradePos.x - 1, centerUpgradePos.y - 1, centerUpgradePos.x + 1, centerUpgradePos.y + 1);
        for (const pos of adjacentPositions) {
            if (terrain.get(pos.x, pos.y) === TERRAIN_MASK_WALL)
                continue;
            upgradePositions.push(new RoomPosition(pos.x, pos.y, room.name));
        }
        upgradePositions.sort(function (a, b) {
            return getRange(a.x, room.anchor.x, a.y, room.anchor.y) - getRange(b.x, room.anchor.x, b.y, room.anchor.y);
        });
        return upgradePositions;
    }
    new RoomCacheObject({
        name: 'upgradePositions',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor: findUpgradePositions,
    });
    function findFastFillerPositions() {
        if (!room.anchor)
            return [];
        const fastFillerPositions = [
            {
                x: room.anchor.x - 1,
                y: room.anchor.y - 1,
            },
            {
                x: room.anchor.x + 1,
                y: room.anchor.y - 1,
            },
            {
                x: room.anchor.x - 1,
                y: room.anchor.y + 1,
            },
            {
                x: room.anchor.x + 1,
                y: room.anchor.y + 1,
            },
        ];
        let adjacentStructures;
        let adjacentStructuresByType;
        for (let index = fastFillerPositions.length - 1; index >= 0; index -= 1) {
            const pos = fastFillerPositions[index];
            adjacentStructures = room.lookForAtArea(LOOK_STRUCTURES, pos.y - 1, pos.x - 1, pos.y + 1, pos.x + 1, true);
            adjacentStructuresByType = {
                spawn: 0,
                extension: 0,
                container: 0,
                link: 0,
            };
            for (const adjacentPosData of adjacentStructures) {
                const { structureType } = adjacentPosData.structure;
                if (adjacentStructuresByType[structureType] === undefined)
                    continue;
                adjacentStructuresByType[structureType] += 1;
            }
            if (adjacentStructuresByType[STRUCTURE_CONTAINER] + adjacentStructuresByType[STRUCTURE_LINK] > 0 &&
                (adjacentStructuresByType[STRUCTURE_SPAWN] > 0 || adjacentStructuresByType[STRUCTURE_EXTENSION] > 1))
                continue;
            fastFillerPositions.splice(index, 1);
        }
        return fastFillerPositions;
    }
    new RoomCacheObject({
        name: 'fastFillerPositions',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: 1,
        room,
        valueConstructor: findFastFillerPositions,
    });
    function findUsedMineralHarvestPositions() {
        const usedHarvestPositions = new Set();
        for (const creepName of room.creepsFromRoom.mineralHarvester) {
            const creep = Game.creeps[creepName];
            if (creep.isDying())
                continue;
            if (creep.memory.packedPos)
                usedHarvestPositions.add(creep.memory.packedPos);
        }
        return usedHarvestPositions;
    }
    new RoomCacheObject({
        name: 'usedMineralHarvestPositions',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: 1,
        room,
        valueConstructor: findUsedMineralHarvestPositions,
    });
    function findUsedUpgradePositions() {
        const usedUpgradePositions = new Set();
        const controllerContainer = room.controllerContainer;
        if (!controllerContainer) {
            const centerUpgadePos = room.roomObjects.centerUpgradePos.getValue();
            usedUpgradePositions.add(pack(centerUpgadePos));
        }
        const hubAnchor = unpackAsRoomPos(room.memory.stampAnchors.hub[0], room.name);
        if (!hubAnchor)
            return false;
        const upgradePositions = room.roomObjects.upgradePositions.getValue();
        if (!upgradePositions.length)
            return false;
        usedUpgradePositions.add(pack(hubAnchor.findClosestByPath(upgradePositions, {
            ignoreCreeps: true,
            ignoreDestructibleStructures: true,
            ignoreRoads: true,
        })));
        for (const creepName of room.myCreeps.controllerUpgrader) {
            const creep = Game.creeps[creepName];
            if (creep.isDying())
                continue;
            if (creep.memory.packedPos)
                usedUpgradePositions.add(creep.memory.packedPos);
        }
        return usedUpgradePositions;
    }
    new RoomCacheObject({
        name: 'usedUpgradePositions',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: 1,
        room,
        valueConstructor: findUsedUpgradePositions,
    });
    function findUsedFastFillerPositions() {
        const usedFastFillerPositions = new Set();
        for (const creepName of room.creepsFromRoom.fastFiller) {
            const creep = Game.creeps[creepName];
            if (creep.isDying())
                continue;
            if (creep.memory.packedPos)
                usedFastFillerPositions.add(creep.memory.packedPos);
        }
        return usedFastFillerPositions;
    }
    new RoomCacheObject({
        name: 'usedFastFillerPositions',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: 1,
        room,
        valueConstructor: findUsedFastFillerPositions,
    });
    new RoomCacheObject({
        name: 'labContainer',
        valueType: 'id',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor() { },
    });
    new RoomCacheObject({
        name: 'remoteNamesByEfficacy',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: 1,
        room,
        valueConstructor() {
            const remotesWithEfficacies = room.memory.remotes.filter(function (roomName) {
                return Memory.rooms[roomName].sourceEfficacies.length;
            });
            return remotesWithEfficacies.sort(function (a1, b1) {
                return (Memory.rooms[a1].sourceEfficacies.reduce((a2, b2) => a2 + b2) /
                    Memory.rooms[a1].sourceEfficacies.length -
                    Memory.rooms[b1].sourceEfficacies.reduce((a2, b2) => a2 + b2) /
                        Memory.rooms[b1].sourceEfficacies.length);
            });
        },
    });
    const roomObject = room.roomObjects[roomObjectName];
    return roomObject.getValue();
};
Room.prototype.actionVisual = function (pos1, pos2, type) {
    const room = this;
    if (!Memory.roomVisuals)
        return;
    const colorsForTypes = {
        success: myColors.lightBlue,
        fail: myColors.red,
    };
    if (!type)
        type = 'success';
    const color = colorsForTypes[type];
    room.visual.circle(pos2.x, pos2.y, { stroke: color });
    room.visual.line(pos1, pos2, { color });
};
Room.prototype.advancedFindPath = function (opts) {
    const room = this;
    function generateRoute() {
        if (opts.origin.roomName === opts.goal.pos.roomName)
            return undefined;
        const route = Game.map.findRoute(opts.origin.roomName, opts.goal.pos.roomName, {
            routeCallback(roomName) {
                if (roomName === opts.goal.pos.roomName)
                    return 1;
                const roomMemory = Memory.rooms[roomName];
                if (!roomMemory)
                    return Infinity;
                if (opts.typeWeights && opts.typeWeights[roomMemory.type])
                    return opts.typeWeights[roomMemory.type];
                return 2;
            },
        });
        if (route === ERR_NO_PATH)
            return undefined;
        return route;
    }
    function generatePath() {
        const route = generateRoute();
        const pathFinderResult = PathFinder.search(opts.origin, opts.goal, {
            plainCost: opts.plainCost || 2,
            swampCost: opts.swampCost || 8,
            maxRooms: route ? 100 : 1,
            maxOps: 100000,
            flee: opts.flee,
            roomCallback(roomName) {
                const room = Game.rooms[roomName];
                if (opts.typeWeights &&
                    Memory.rooms[roomName] &&
                    opts.typeWeights[Memory.rooms[roomName].type] === Infinity)
                    return false;
                const cm = new PathFinder.CostMatrix();
                if (!route) {
                    let x;
                    let y = 0;
                    for (x = 0; x < 50; x += 1)
                        cm.set(x, y, 255);
                    x = 0;
                    for (y = 0; y < 50; y += 1)
                        cm.set(x, y, 255);
                    y = 49;
                    for (x = 0; x < 50; x += 1)
                        cm.set(x, y, 255);
                    x = 49;
                    for (y = 0; y < 50; y += 1)
                        cm.set(x, y, 255);
                }
                for (const weight in opts.weightPositions) {
                    const positions = opts.weightPositions[weight];
                    const weightNum = parseInt(weight);
                    for (const pos of positions)
                        cm.set(pos.x, pos.y, weightNum);
                }
                if (opts.weightCostMatrixes) {
                    for (let x = 0; x < roomDimensions; x += 1) {
                        for (let y = 0; y < roomDimensions; y += 1) {
                            for (const weightCM of opts.weightCostMatrixes)
                                if (weightCM)
                                    cm.set(x, y, weightCM.get(x, y));
                        }
                    }
                }
                if (!room)
                    return cm;
                if (opts.creep && opts.creep.memory.roads)
                    for (const road of room.structures.road)
                        cm.set(road.pos.x, road.pos.y, 1);
                for (const weight in opts.weightStructures) {
                    const weightNum = parseInt(weight);
                    for (const structureType of opts.weightStructures[weight]) {
                        for (const structure of room.structures[structureType])
                            cm.set(structure.pos.x, structure.pos.y, weightNum);
                    }
                }
                for (const portal of room.structures.portal)
                    cm.set(portal.pos.x, portal.pos.y, 255);
                for (const cSite of room.allyCSites)
                    cm.set(cSite.pos.x, cSite.pos.y, 255);
                avoidEnemyRanges();
                function avoidEnemyRanges() {
                    if (!opts.avoidEnemyRanges)
                        return;
                    if (room.controller && room.controller.my && room.controller.safeMode)
                        return;
                    const enemyAttackers = [];
                    const enemyRangedAttackers = [];
                    for (const enemyCreep of room.enemyCreeps) {
                        if (enemyCreep.parts.ranged_attack > 0) {
                            enemyRangedAttackers.push(enemyCreep);
                            return;
                        }
                        if (enemyCreep.parts.attack > 0)
                            enemyAttackers.push(enemyCreep);
                    }
                    for (const enemyAttacker of enemyAttackers) {
                        const positions = findPositionsInsideRect(enemyAttacker.pos.x - 2, enemyAttacker.pos.y - 2, enemyAttacker.pos.x + 2, enemyAttacker.pos.y + 2);
                        for (const pos of positions)
                            cm.set(pos.x, pos.y, 255);
                    }
                    for (const enemyAttacker of enemyRangedAttackers) {
                        const positions = findPositionsInsideRect(enemyAttacker.pos.x - 3, enemyAttacker.pos.y - 3, enemyAttacker.pos.x + 3, enemyAttacker.pos.y + 3);
                        for (const pos of positions)
                            cm.set(pos.x, pos.y, 255);
                    }
                }
                if (opts.avoidNotMyCreeps) {
                    for (const creep of room.enemyCreeps)
                        cm.set(creep.pos.x, creep.pos.y, 255);
                    for (const creep of room.find(FIND_HOSTILE_POWER_CREEPS))
                        cm.set(creep.pos.x, creep.pos.y, 255);
                }
                if (opts.avoidImpassibleStructures) {
                    const ramparts = room.structures.rampart;
                    for (const rampart of ramparts) {
                        if (rampart.my) {
                            if (!opts.myRampartWeight)
                                continue;
                            cm.set(rampart.pos.x, rampart.pos.y, opts.myRampartWeight);
                            continue;
                        }
                        if (rampart.isPublic)
                            continue;
                        cm.set(rampart.pos.x, rampart.pos.y, 255);
                    }
                    for (const structureType of impassibleStructureTypes) {
                        for (const structure of room.structures[structureType]) {
                            cm.set(structure.pos.x, structure.pos.y, 255);
                        }
                        for (const cSite of room.cSites[structureType]) {
                            cm.set(cSite.pos.x, cSite.pos.y, 255);
                        }
                    }
                }
                if (opts.avoidStationaryPositions) {
                    for (const index in room.sources) {
                        const sourcePositions = room.sourcePositions[index];
                        if (!sourcePositions)
                            continue;
                        for (const pos of sourcePositions)
                            cm.set(pos.x, pos.y, 10);
                    }
                    if (room.anchor) {
                        const upgradePositions = room.get('upgradePositions');
                        const deliverUpgradePos = room.anchor.findClosestByPath(upgradePositions, {
                            ignoreCreeps: true,
                            ignoreDestructibleStructures: true,
                            ignoreRoads: true,
                        });
                        for (const pos of upgradePositions) {
                            if (arePositionsEqual(pos, deliverUpgradePos))
                                continue;
                            cm.set(pos.x, pos.y, 10);
                        }
                    }
                    const hubAnchor = room.memory.stampAnchors && room.memory.stampAnchors.hub[0]
                        ? unpackAsRoomPos(room.memory.stampAnchors.hub[0], roomName)
                        : undefined;
                    if (hubAnchor)
                        cm.set(hubAnchor.x, hubAnchor.y, 10);
                    const fastFillerPositions = room.get('fastFillerPositions');
                    if (fastFillerPositions.length) {
                        for (const pos of fastFillerPositions)
                            cm.set(pos.x, pos.y, 10);
                    }
                }
                return cm;
            },
        });
        if (pathFinderResult.incomplete) {
            customLog('Incomplete Path', `${pathFinderResult.path}, ${JSON.stringify(opts.goal.pos)}`, myColors.white, myColors.red);
            room.pathVisual(pathFinderResult.path, 'red');
            room.visual.line(opts.origin, opts.goal.pos, {
                color: myColors.red,
                width: 0.15,
                opacity: 0.3,
                lineStyle: 'solid',
            });
            return [];
        }
        return pathFinderResult.path;
    }
    return generatePath();
};
Room.prototype.findType = function (scoutingRoom) {
    const room = this;
    const { controller } = room;
    room.memory.lastScout = Game.time;
    const [EWstring, NSstring] = room.name.match(/\d+/g);
    const EW = parseInt(EWstring);
    const NS = parseInt(NSstring);
    if (EW % 10 === 0 && NS % 10 === 0) {
        room.memory.type = 'intersection';
        return;
    }
    if (EW % 10 === 0 || NS % 10 === 0) {
        room.memory.type = 'highway';
        return;
    }
    if (EW % 5 === 0 && NS % 5 === 0) {
        room.memory.type = 'keeperCenter';
        return;
    }
    if (Math.abs(5 - (EW % 10)) <= 1 && Math.abs(5 - (NS % 10)) <= 1) {
        room.memory.type = 'keeper';
        return;
    }
    if (controller) {
        if (controller.owner) {
            if (controller.my)
                return;
            const owner = controller.owner.username;
            room.memory.owner = owner;
            if (Memory.allyList.includes(owner)) {
                room.memory.type = 'ally';
                return;
            }
            room.memory.type = 'enemy';
            const playerInfo = Memory.players[owner];
            if (!playerInfo)
                Memory.players[owner] = {};
            const level = controller.level;
            if (level)
                Memory.players[owner].GRCL = Math.max(level, playerInfo.GRCL);
            room.memory.level = level;
            let threat = 0;
            threat += Math.pow(level, 2);
            threat += room.structures.spawn.length * 50;
            threat += room.structures.nuker.length * 300;
            threat += Math.pow(room.structures.lab.length * 10000, 0.4);
            room.memory.OT = threat;
            Memory.players[owner].OT = Math.max(threat, playerInfo.OT);
            threat = 0;
            const energy = room.findStoredResourceAmount(RESOURCE_ENERGY);
            room.memory.energy = energy;
            threat += Math.pow(energy, 0.5);
            const ramparts = room.structures.rampart;
            const avgRampartHits = ramparts.reduce((total, rampart) => total + rampart.hits, 0) / ramparts.length;
            threat += Math.pow(avgRampartHits, 0.5);
            threat += room.structures.spawn.length * 100;
            threat += room.structures.tower.length * 300;
            const hasTerminal = room.terminal !== undefined;
            threat += 800;
            room.memory.terminal = hasTerminal;
            threat *= 1.2;
            const powerEnabled = controller.isPowerEnabled;
            room.memory.powerEnabled = powerEnabled;
            threat *= 0.5;
            room.memory.DT = threat;
            Memory.players[owner].DT = Math.max(threat, playerInfo.DT);
            return;
        }
        const harvestedSources = room.find(FIND_SOURCES).filter(source => source.ticksToRegeneration > 0);
        if (isReservedRemote())
            return;
        function isReservedRemote() {
            if (!controller.reservation)
                return false;
            if (controller.reservation.username === Memory.me)
                return false;
            if (controller.reservation.username === 'Invader')
                return false;
            const roads = room.structures.road;
            const containers = room.structures.container;
            if (roads.length === 0 && containers.length === 0 && !harvestedSources)
                return false;
            if (!Memory.allyList.includes(controller.reservation.username)) {
                room.memory.type = 'enemyRemote';
                room.memory.owner = controller.reservation.username;
                return true;
            }
            room.memory.type = 'allyRemote';
            room.memory.owner = controller.reservation.username;
            return true;
        }
        if (isUnReservedRemote())
            return;
        function isUnReservedRemote() {
            if (controller.reservation) {
                if (controller.reservation.username === Memory.me)
                    return false;
                if (controller.reservation.username === 'Invader')
                    return false;
            }
            if (harvestedSources.length === 0)
                return false;
            const creepsNotMine = room.enemyCreeps.concat(room.allyCreeps);
            for (const creep of creepsNotMine) {
                if (creep.owner.username === 'Invader')
                    continue;
                if (creep.parts.work > 0) {
                    if (Memory.allyList.includes(creep.owner.username)) {
                        room.memory.type = 'allyRemote';
                        room.memory.owner = creep.owner.username;
                        return true;
                    }
                    room.memory.type = 'enemyRemote';
                    room.memory.owner = creep.owner.username;
                    return true;
                }
            }
            return false;
        }
        if (room.makeRemote(scoutingRoom))
            return;
        room.memory.type = 'neutral';
        room.createClaimRequest();
    }
};
Room.prototype.makeRemote = function (scoutingRoom) {
    const room = this;
    let distance = Game.map.getRoomLinearDistance(scoutingRoom.name, room.name);
    if (distance < 4)
        distance = advancedFindDistance(scoutingRoom.name, room.name, {
            keeper: Infinity,
            enemy: Infinity,
            enemyRemote: Infinity,
            ally: Infinity,
            allyRemote: Infinity,
            highway: Infinity,
        });
    if (distance < 4) {
        if (room.memory.type === 'remote' && scoutingRoom.name === room.memory.commune)
            return true;
        if (!scoutingRoom.anchor)
            return true;
        const newSourceEfficacies = [];
        const sourceNames = ['source1', 'source2'];
        for (const sourceName of sourceNames) {
            const source = room.get(sourceName);
            if (!source)
                break;
            const path = room.advancedFindPath({
                origin: source.pos,
                goal: { pos: scoutingRoom.anchor, range: 3 },
            });
            newSourceEfficacies.push(path.length);
        }
        if (room.memory.type !== 'remote' || !Memory.communes.includes(room.memory.commune)) {
            room.memory.type = 'remote';
            room.memory.commune = scoutingRoom.name;
            scoutingRoom.memory.remotes.push(room.name);
            room.memory.sourceEfficacies = newSourceEfficacies;
            room.memory.needs = [];
            for (const key in remoteNeedsIndex)
                room.memory.needs[parseInt(key)] = 0;
            return true;
        }
        const currentAvgSourceEfficacy = room.memory.sourceEfficacies.reduce((sum, el) => sum + el) / room.memory.sourceEfficacies.length;
        const newAvgSourceEfficacy = newSourceEfficacies.reduce((sum, el) => sum + el) / newSourceEfficacies.length;
        if (newAvgSourceEfficacy >= currentAvgSourceEfficacy)
            return true;
        room.memory.type = 'remote';
        room.memory.commune = scoutingRoom.name;
        scoutingRoom.memory.remotes.push(room.name);
        room.memory.sourceEfficacies = newSourceEfficacies;
        room.memory.needs = [];
        for (const key in remoteNeedsIndex)
            room.memory.needs[parseInt(key)] = 0;
        return true;
    }
    if (room.memory.type !== 'remote')
        return false;
    if (!Memory.communes.includes(room.memory.commune))
        return false;
    return true;
};
Room.prototype.cleanMemory = function () {
    const room = this;
    if (!room.memory.type)
        return;
    for (const key in room.memory) {
        if (!roomTypeProperties[key])
            continue;
        if (roomTypes[room.memory.type][key])
            continue;
        delete room.memory[key];
    }
};
Room.prototype.findStoredResourceAmount = function (resourceType) {
    const room = this;
    if (!room.storedResources)
        room.storedResources = {};
    else if (room.storedResources[resourceType])
        return room.storedResources[resourceType];
    room.storedResources[resourceType] = 0;
    const storageStructures = [room.storage, room.terminal];
    for (const storageStructure of storageStructures) {
        if (!storageStructure)
            continue;
        room.storedResources[resourceType] += storageStructure.store.getUsedCapacity(resourceType);
    }
    return room.storedResources[resourceType];
};
Room.prototype.distanceTransform = function (initialCM, enableVisuals, x1 = 0, y1 = 0, x2 = roomDimensions, y2 = roomDimensions) {
    const room = this;
    const distanceCM = new PathFinder.CostMatrix();
    if (!initialCM)
        initialCM = room.get('terrainCM');
    let x;
    let y;
    for (x = Math.max(x1 - 1, 0); x <= Math.min(x2 + 1, roomDimensions); x += 1) {
        for (y = Math.max(y1 - 1, 0); y <= Math.min(y2 + 1, roomDimensions); y += 1) {
            distanceCM.set(x, y, initialCM.get(x, y) === 255 ? 0 : 255);
        }
    }
    let top;
    let left;
    let topLeft;
    let topRight;
    let bottomLeft;
    for (x = x1; x <= x2; x += 1) {
        for (y = y1; y <= y2; y += 1) {
            top = distanceCM.get(x, y - 1);
            left = distanceCM.get(x - 1, y);
            topLeft = distanceCM.get(x - 1, y - 1);
            topRight = distanceCM.get(x + 1, y - 1);
            bottomLeft = distanceCM.get(x - 1, y + 1);
            distanceCM.set(x, y, Math.min(Math.min(top, left, topLeft, topRight, bottomLeft) + 1, distanceCM.get(x, y)));
        }
    }
    let bottom;
    let right;
    let bottomRight;
    for (x = x2; x >= x1; x -= 1) {
        for (y = y2; y >= y1; y -= 1) {
            bottom = distanceCM.get(x, y + 1);
            right = distanceCM.get(x + 1, y);
            bottomRight = distanceCM.get(x + 1, y + 1);
            topRight = distanceCM.get(x + 1, y - 1);
            bottomLeft = distanceCM.get(x - 1, y + 1);
            distanceCM.set(x, y, Math.min(Math.min(bottom, right, bottomRight, topRight, bottomLeft) + 1, distanceCM.get(x, y)));
        }
    }
    if (enableVisuals && Memory.roomVisuals) {
        for (x = x1; x <= x2; x += 1) {
            for (y = y1; y <= y2; y += 1) {
                room.visual.rect(x - 0.5, y - 0.5, 1, 1, {
                    fill: `hsl(${200}${distanceCM.get(x, y) * 10}, 100%, 60%)`,
                    opacity: 0.4,
                });
            }
        }
    }
    return distanceCM;
};
Room.prototype.diagonalDistanceTransform = function (initialCM, enableVisuals, x1 = 0, y1 = 0, x2 = roomDimensions, y2 = roomDimensions) {
    const room = this;
    const distanceCM = new PathFinder.CostMatrix();
    if (!initialCM)
        initialCM = room.get('terrainCM');
    let x;
    let y;
    for (x = x1; x <= x2; x += 1) {
        for (y = y1; y <= y2; y += 1) {
            distanceCM.set(x, y, initialCM.get(x, y) === 255 ? 0 : 255);
        }
    }
    let top;
    let left;
    for (x = x1; x <= x2; x += 1) {
        for (y = y1; y <= y2; y += 1) {
            top = distanceCM.get(x, y - 1);
            left = distanceCM.get(x - 1, y);
            distanceCM.set(x, y, Math.min(Math.min(top, left) + 1, distanceCM.get(x, y)));
        }
    }
    let bottom;
    let right;
    for (x = x2; x >= x1; x -= 1) {
        for (y = y2; y >= y1; y -= 1) {
            bottom = distanceCM.get(x, y + 1);
            right = distanceCM.get(x + 1, y);
            distanceCM.set(x, y, Math.min(Math.min(bottom, right) + 1, distanceCM.get(x, y)));
        }
    }
    if (enableVisuals && Memory.roomVisuals) {
        for (x = x1; x <= x2; x += 1) {
            for (y = y1; y <= y2; y += 1) {
                room.visual.rect(x - 0.5, y - 0.5, 1, 1, {
                    fill: `hsl(${200}${distanceCM.get(x, y) * 10}, 100%, 60%)`,
                    opacity: 0.4,
                });
            }
        }
    }
    return distanceCM;
};
Room.prototype.floodFill = function (seeds) {
    const room = this;
    const floodCM = new PathFinder.CostMatrix();
    const terrain = room.getTerrain();
    const visitedCM = new PathFinder.CostMatrix();
    let depth = 0;
    let thisGeneration = seeds;
    let nextGeneration = [];
    let pos;
    for (pos of seeds) {
        visitedCM.set(pos.x, pos.y, 1);
    }
    let adjacentPositions;
    let adjacentPos;
    while (thisGeneration.length) {
        nextGeneration = [];
        for (pos of thisGeneration) {
            if (depth > 0) {
                if (terrain.get(pos.x, pos.y) === TERRAIN_MASK_WALL)
                    continue;
                floodCM.set(pos.x, pos.y, depth);
                if (Memory.roomVisuals)
                    room.visual.rect(pos.x - 0.5, pos.y - 0.5, 1, 1, {
                        fill: `hsl(${200}${depth * 2}, 100%, 60%)`,
                        opacity: 0.4,
                    });
            }
            adjacentPositions = findPositionsInsideRect(pos.x - 1, pos.y - 1, pos.x + 1, pos.y + 1);
            for (adjacentPos of adjacentPositions) {
                if (visitedCM.get(adjacentPos.x, adjacentPos.y) === 1)
                    continue;
                visitedCM.set(adjacentPos.x, adjacentPos.y, 1);
                nextGeneration.push(adjacentPos);
            }
        }
        thisGeneration = nextGeneration;
        depth += 1;
    }
    return floodCM;
};
Room.prototype.findClosestPosOfValue = function (opts) {
    const room = this;
    function isViableAnchor(pos) {
        const posValue = opts.CM.get(pos.x, pos.y);
        if (posValue === 255)
            return false;
        if (posValue < opts.requiredValue)
            return false;
        if (!opts.adjacentToRoads)
            return true;
        const adjacentPositions = findPositionsInsideRect(pos.x - 1, pos.y - 1, pos.x + 1, pos.y + 1);
        for (const adjacentPos of adjacentPositions) {
            if (opts.roadCM.get(adjacentPos.x, adjacentPos.y) !== 1)
                continue;
            return (true);
        }
        return false;
    }
    let pos;
    let adjacentPos;
    while ((opts.reduceIterations || 0) >= 0) {
        const visitedCM = new PathFinder.CostMatrix();
        visitedCM.set(opts.startPos.x, opts.startPos.y, 1);
        let thisGeneration = [opts.startPos];
        let nextGeneration = [];
        let canUseWalls = true;
        while (thisGeneration.length) {
            nextGeneration = [];
            for (pos of thisGeneration) {
                if (isViableAnchor(pos))
                    return new RoomPosition(pos.x, pos.y, room.name);
                const adjacentPositions = [
                    {
                        x: pos.x - 1,
                        y: pos.y,
                    },
                    {
                        x: pos.x + 1,
                        y: pos.y,
                    },
                    {
                        x: pos.x,
                        y: pos.y - 1,
                    },
                    {
                        x: pos.x,
                        y: pos.y + 1,
                    },
                ];
                for (adjacentPos of adjacentPositions) {
                    if (adjacentPos.x < 0 ||
                        adjacentPos.x >= roomDimensions ||
                        adjacentPos.y < 0 ||
                        adjacentPos.y >= roomDimensions)
                        continue;
                    if (visitedCM.get(adjacentPos.x, adjacentPos.y) === 1)
                        continue;
                    visitedCM.set(adjacentPos.x, adjacentPos.y, 1);
                    if (canUseWalls && opts.CM.get(adjacentPos.x, adjacentPos.y) !== 255)
                        canUseWalls = false;
                    nextGeneration.push(adjacentPos);
                }
            }
            thisGeneration = nextGeneration;
        }
        opts.reduceIterations -= 1;
        opts.requiredValue -= 1;
    }
    return false;
};
Room.prototype.pathVisual = function (path, color) {
    const room = this;
    if (!Memory.roomVisuals)
        return;
    if (!path.length)
        return;
    const currentRoomName = path[0].roomName;
    for (let index = 0; index < path.length; index += 1) {
        const pos = path[index];
        if (pos.roomName === currentRoomName)
            continue;
        path.splice(index, path.length - 1);
        break;
    }
    room.visual.poly(path, {
        stroke: myColors[color],
        strokeWidth: 0.15,
        opacity: 0.3,
        lineStyle: 'solid',
    });
};
Room.prototype.findAllyCSiteTargetID = function (creep) {
    if (!this.allyCSites.length)
        return false;
    for (const structureType of structureTypesByBuildPriority) {
        const cSitesOfType = this.allyCSitesByType[structureType];
        if (!cSitesOfType.length)
            continue;
        const anchor = this.anchor || (creep === null || creep === void 0 ? void 0 : creep.pos) || new RoomPosition(25, 25, this.name);
        this.memory.cSiteTargetID = anchor.findClosestByPath(cSitesOfType, {
            ignoreCreeps: true,
            ignoreDestructibleStructures: true,
            ignoreRoads: true,
            range: 3,
        }).id;
        return true;
    }
    return false;
};
Room.prototype.groupRampartPositions = function (rampartPositions, rampartPlans) {
    const room = this;
    const visitedCM = new PathFinder.CostMatrix();
    const groupedPositions = [];
    let groupIndex = 0;
    for (const packedPos of rampartPositions) {
        const pos = unpackAsPos(packedPos);
        if (visitedCM.get(pos.x, pos.y) === 1)
            continue;
        visitedCM.set(pos.x, pos.y, 1);
        groupedPositions[groupIndex] = [new RoomPosition(pos.x, pos.y, room.name)];
        let thisGeneration = [pos];
        let nextGeneration = [];
        while (thisGeneration.length) {
            nextGeneration = [];
            for (const pos of thisGeneration) {
                const adjacentPositions = findPositionsInsideRect(pos.x - 1, pos.y - 1, pos.x + 1, pos.y + 1);
                for (const adjacentPos of adjacentPositions) {
                    if (adjacentPos.x <= 0 ||
                        adjacentPos.x >= roomDimensions ||
                        adjacentPos.y <= 0 ||
                        adjacentPos.y >= roomDimensions)
                        continue;
                    if (visitedCM.get(adjacentPos.x, adjacentPos.y) === 1)
                        continue;
                    visitedCM.set(adjacentPos.x, adjacentPos.y, 1);
                    if (rampartPlans.get(adjacentPos.x, adjacentPos.y) !== 1)
                        continue;
                    nextGeneration.push(adjacentPos);
                    groupedPositions[groupIndex].push(new RoomPosition(adjacentPos.x, adjacentPos.y, room.name));
                }
            }
            thisGeneration = nextGeneration;
        }
        groupIndex += 1;
    }
    return groupedPositions;
};
Room.prototype.createPullTask = function (creator) {
};
Room.prototype.createPickupTasks = function (creator) {
};
Room.prototype.createOfferTasks = function (creator) {
};
Room.prototype.createTransferTasks = function (creator) {
};
Room.prototype.createWithdrawTasks = function (creator) {
};
Room.prototype.estimateIncome = function () {
    const harvesterNames = this.creepsFromRoom.source1Harvester
        .concat(this.creepsFromRoom.source2Harvester)
        .concat(this.creepsFromRoom.source1RemoteHarvester)
        .concat(this.creepsFromRoom.source2RemoteHarvester);
    let income = 0;
    for (const creepName of harvesterNames) {
        const creep = Game.creeps[creepName];
        income += Math.min(6, creep.parts.work) * minHarvestWorkRatio;
    }
    return income;
};
Room.prototype.findRoomPositionsInsideRect = function (x1, y1, x2, y2) {
    const positions = [];
    for (let x = x1; x <= x2; x += 1) {
        for (let y = y1; y <= y2; y += 1) {
            if (x < 0 || x >= roomDimensions || y < 0 || y >= roomDimensions)
                continue;
            positions.push(new RoomPosition(x, y, this.name));
        }
    }
    return positions;
};
Room.prototype.getPartsOfRoleAmount = function (role, type) {
    let partsAmount = 0;
    let creep;
    for (const creepName of this.creepsFromRoom[role]) {
        creep = Game.creeps[creepName];
        if (!type) {
            partsAmount += creep.body.length;
            continue;
        }
        partsAmount += creep.body.filter(part => part.type === type).length;
    }
    return partsAmount;
};
Room.prototype.createClaimRequest = function () {
    if (this.sources.length !== 2)
        return false;
    if (this.memory.notClaimable)
        return false;
    if (Memory.claimRequests[this.name])
        return false;
    basePlanner(this);
    if (!this.memory.planned)
        return false;
    let score = 0;
    const closestClaimTypeName = findClosestClaimType(this.name);
    const closestCommuneRange = Game.map.getRoomLinearDistance(closestClaimTypeName, this.name);
    score += Math.abs(prefferedCommuneRange - closestCommuneRange);
    score += this.sourcePaths[0].length / 10;
    score += this.sourcePaths[1].length / 10;
    score += this.upgradePathLength / 10;
    score += this.findSwampPlainsRatio() * 10;
    Memory.claimRequests[this.name] = {
        needs: [1, 20, 0],
        score,
    };
    return true;
};
Room.prototype.findSwampPlainsRatio = function () {
    const terrainAmounts = [0, 0, 0];
    const terrain = this.getTerrain();
    for (let x = 0; x < roomDimensions; x += 1) {
        for (let y = 0; y < roomDimensions; y += 1) {
            terrainAmounts[terrain.get(x, y)] += 1;
        }
    }
    return terrainAmounts[TERRAIN_MASK_SWAMP] / terrainAmounts[0];
};

Room.prototype.advancedSell = function (resourceType, amount, targetAmount) {
    var _a;
    const mySpecificOrders = ((_a = internationalManager.myOrders[this.name]) === null || _a === void 0 ? void 0 : _a[ORDER_SELL][resourceType]) || [];
    for (const order of mySpecificOrders)
        amount -= order.remainingAmount;
    if (amount <= targetAmount * 0.5)
        return false;
    for (const order of internationalManager.getBuyOrders(resourceType)) {
        const dealAmount = findLargestTransactionAmount(this.terminal.store.energy * 0.75, amount, this.name, order.roomName);
        return Game.market.deal(order.id, Math.min(dealAmount, order.remainingAmount), this.name) == OK;
    }
    if (mySpecificOrders.length)
        return false;
    if (internationalManager.myOrdersCount === 300)
        return false;
    return (Game.market.createOrder({
        roomName: this.name,
        type: ORDER_SELL,
        resourceType,
        price: getAvgPrice(resourceType) * 0.8,
        totalAmount: amount,
    }) == OK);
};
Room.prototype.advancedBuy = function (resourceType, amount, targetAmount) {
    var _a;
    const mySpecificOrders = ((_a = internationalManager.myOrders[this.name]) === null || _a === void 0 ? void 0 : _a[ORDER_BUY][resourceType]) || [];
    for (const order of mySpecificOrders)
        amount -= order.remainingAmount;
    if (amount <= targetAmount * 0.5)
        return false;
    for (const order of internationalManager.getSellOrders(resourceType, getAvgPrice(resourceType) * 1.2)) {
        const dealAmount = findLargestTransactionAmount(this.terminal.store.energy, amount, this.name, order.roomName);
        return Game.market.deal(order.id, Math.min(dealAmount, order.remainingAmount), this.name) == OK;
    }
    if (mySpecificOrders.length)
        return false;
    if (internationalManager.myOrdersCount === 300)
        return false;
    return (Game.market.createOrder({
        roomName: this.name,
        type: ORDER_BUY,
        resourceType,
        price: getAvgPrice(resourceType) * 1.2,
        totalAmount: amount,
    }) == OK);
};

function marketManager(room) {
    const { terminal } = room;
    if (!terminal)
        return;
    if (terminal.store.getUsedCapacity(RESOURCE_ENERGY) < 50000)
        allyManager.requestResource(room.name, RESOURCE_ENERGY, 60000 - terminal.store.getUsedCapacity(RESOURCE_ENERGY), 0.75);
    if (!internationalManager.marketIsFunctional)
        return;
    for (const mineral of minerals) {
        const mineralAmount = terminal.store.getUsedCapacity(mineral);
        if (mineralAmount > 5000)
            continue;
        allyManager.requestResource(room.name, mineral, 7000 - mineralAmount, 0.25);
    }
    if (terminal.cooldown > 0)
        return;
    const resourceRequests = allyManager.allyRequests.filter(request => request.requestType === allyManager.requestTypes.RESOURCE);
    resourceRequests.sort((a, b) => a.priority - b.priority).reverse();
    let amount = 0;
    for (const request of resourceRequests) {
        if (!request.maxAmount)
            continue;
        amount = 0;
        if (minerals.includes(request.resourceType)) {
            if (terminal.store.getUsedCapacity(request.resourceType) < 20000)
                continue;
            amount = Math.min(request.maxAmount, terminal.store.getUsedCapacity(request.resourceType) / 2);
            terminal.send(request.resourceType, amount, request.roomName, `Sending ${request} to ally`);
            return;
        }
        if (request.resourceType === RESOURCE_ENERGY) {
            if (terminal.store.getUsedCapacity(request.resourceType) < 60000)
                continue;
            amount = Math.min(request.maxAmount, terminal.store.getUsedCapacity(request.resourceType) / 2);
            terminal.send(request.resourceType, amount, request.roomName, `Sending ${request} to ally`);
            return;
        }
        continue;
    }
    let resourceType;
    let targetAmount = 8000;
    for (resourceType of minerals) {
        if (terminal.store[resourceType] <= targetAmount)
            continue;
        targetAmount *= 0.75;
        if (room.advancedSell(resourceType, terminal.store[resourceType] - targetAmount, targetAmount))
            return;
    }
    resourceType = RESOURCE_ENERGY;
    targetAmount = 30000;
    if (terminal.store[resourceType] < targetAmount) {
        targetAmount *= 1.2;
        if (room.advancedBuy(resourceType, targetAmount - terminal.store[resourceType], targetAmount))
            return;
    }
}

StructureSpawn.prototype.advancedSpawn = function (spawnRequest) {
    return this.spawnCreep(spawnRequest.body, `${spawnRequest.role} ${spawnRequest.cost} ${this.room.name} T${spawnRequest.tier} ${newID()}`, spawnRequest.extraOpts);
};
Room.prototype.constructSpawnRequests = function (opts) {
    if (!opts)
        return;
    if (opts.minCreeps) {
        this.spawnRequestIndividually(opts);
        return;
    }
    this.spawnRequestByGroup(opts);
};
Room.prototype.decideMaxCostPerCreep = function (maxCostPerCreep) {
    if (!maxCostPerCreep)
        maxCostPerCreep = this.energyCapacityAvailable;
    if (this.myCreeps.source1Harvester.length + this.myCreeps.source2Harvester.length === 0 ||
        this.myCreeps.hauler.length === 0) {
        return Math.min(maxCostPerCreep, this.energyAvailable);
    }
    return Math.min(maxCostPerCreep, this.energyCapacityAvailable);
};
Room.prototype.createSpawnRequest = function (priority, role, body, tier, cost, memory) {
    this.spawnRequests[priority] = {
        role,
        body,
        tier,
        cost,
        extraOpts: {
            memory,
            energyStructures: this.spawningStructuresByPriority,
            dryRun: true,
        },
    };
};
Room.prototype.spawnRequestIndividually = function (opts) {
    const maxCostPerCreep = Math.max(this.decideMaxCostPerCreep(opts.maxCostPerCreep), opts.minCost);
    while (opts.minCreeps >
        (opts.groupComparator ? opts.groupComparator.length : this.creepsFromRoom[opts.role].length)) {
        const body = [];
        let tier = 0;
        let cost = 0;
        let partCost;
        if (opts.defaultParts.length) {
            tier += 1;
            for (const part of opts.defaultParts) {
                partCost = BODYPART_COST[part];
                if (cost + partCost > maxCostPerCreep)
                    break;
                body.push(part);
                cost += partCost;
            }
        }
        if (opts.extraParts.length) {
            let remainingAllowedParts = Math.min(50 - opts.defaultParts.length, opts.extraParts.length * opts.partsMultiplier);
            while (cost < maxCostPerCreep && remainingAllowedParts > 0) {
                for (const part of opts.extraParts) {
                    cost += BODYPART_COST[part];
                    body.push(part);
                    remainingAllowedParts -= 1;
                }
                tier += 1;
            }
            let partIndex = opts.extraParts.length;
            if (cost > maxCostPerCreep || remainingAllowedParts < 0) {
                let part;
                while (partIndex > 0) {
                    part = opts.extraParts[partIndex];
                    partCost = BODYPART_COST[part];
                    if (cost - partCost < opts.minCost)
                        break;
                    cost -= partCost;
                    body.pop();
                    remainingAllowedParts += 1;
                    partIndex -= 1;
                }
                tier -= 1;
            }
        }
        this.createSpawnRequest(opts.priority, opts.role, body, tier, cost, opts.memoryAdditions);
        opts.minCreeps -= 1;
    }
};
Room.prototype.spawnRequestByGroup = function (opts) {
    const maxCostPerCreep = Math.max(this.decideMaxCostPerCreep(opts.maxCostPerCreep), opts.minCost);
    let totalExtraParts = Math.floor(opts.extraParts.length * opts.partsMultiplier);
    const maxPartsPerCreep = Math.min(50 - opts.defaultParts.length, totalExtraParts);
    for (const creepName of opts.groupComparator || this.creepsFromRoom[opts.role]) {
        totalExtraParts -= Game.creeps[creepName].body.length - opts.defaultParts.length;
    }
    if (totalExtraParts < maxPartsPerCreep * (opts.threshold || 0.25))
        return;
    opts.maxCreeps -= opts.groupComparator
        ? opts.groupComparator.length
        : this.creepsFromRoom[opts.role].length;
    while (totalExtraParts >= opts.extraParts.length && opts.maxCreeps > 0) {
        const body = [];
        let tier = 0;
        let cost = 0;
        let partCost;
        let remainingAllowedParts = maxPartsPerCreep;
        if (opts.defaultParts.length) {
            tier += 1;
            for (const part of opts.defaultParts) {
                partCost = BODYPART_COST[part];
                cost += partCost;
                body.push(part);
            }
        }
        while (cost < maxCostPerCreep && remainingAllowedParts > 0) {
            for (const part of opts.extraParts) {
                cost += BODYPART_COST[part];
                body.push(part);
                remainingAllowedParts -= 1;
                totalExtraParts -= 1;
            }
            tier += 1;
        }
        if (cost > maxCostPerCreep || remainingAllowedParts < 0) {
            let part;
            let partIndex = opts.extraParts.length - 1;
            while (partIndex >= 0) {
                part = opts.extraParts[partIndex];
                partCost = BODYPART_COST[part];
                if (cost - partCost < opts.minCost)
                    break;
                cost -= partCost;
                body.pop();
                remainingAllowedParts += 1;
                totalExtraParts += 1;
                partIndex -= 1;
            }
            tier -= 1;
        }
        this.createSpawnRequest(opts.priority, opts.role, body, tier, cost, opts.memoryAdditions);
        opts.maxCreeps -= 1;
    }
};

Room.prototype.spawnRequester = function () {
    if (Memory.cpuLogging)
        var managerCPUStart = Game.cpu.getUsed();
    const spawnEnergyCapacity = this.energyCapacityAvailable;
    const mostOptimalSource = this.sourcesByEfficacy[0];
    let partsMultiplier;
    this.constructSpawnRequests((() => {
        const sourceIndex = 0;
        const priority = (mostOptimalSource.index === sourceIndex ? 0 : 1) + this.creepsFromRoom.source1Harvester.length;
        const role = 'source1Harvester';
        if (spawnEnergyCapacity >= 800) {
            return {
                role,
                defaultParts: [CARRY],
                extraParts: [WORK, MOVE, WORK],
                partsMultiplier: 3,
                minCreeps: 1,
                minCost: 200,
                priority,
                memoryAdditions: {
                    SI: sourceIndex,
                    roads: true,
                },
            };
        }
        if (spawnEnergyCapacity >= 750) {
            return {
                role,
                defaultParts: [],
                extraParts: [WORK, MOVE, WORK],
                partsMultiplier: 3,
                minCreeps: 1,
                minCost: 200,
                priority,
                memoryAdditions: {
                    SI: sourceIndex,
                    roads: true,
                },
            };
        }
        if (spawnEnergyCapacity >= 600) {
            return {
                role,
                defaultParts: [MOVE, CARRY],
                extraParts: [WORK],
                partsMultiplier: 6,
                minCreeps: 1,
                minCost: 300,
                priority,
                memoryAdditions: {
                    SI: sourceIndex,
                    roads: true,
                },
            };
        }
        if (this.sourceContainers[sourceIndex]) {
            return {
                role,
                defaultParts: [MOVE],
                extraParts: [WORK],
                partsMultiplier: 6,
                minCreeps: 1,
                minCost: 150,
                priority,
                memoryAdditions: {
                    SI: sourceIndex,
                    roads: true,
                },
            };
        }
        return {
            role,
            defaultParts: [MOVE, CARRY],
            extraParts: [WORK],
            partsMultiplier: 6,
            minCreeps: undefined,
            maxCreeps: Math.min(3, this.sourcePositions[sourceIndex].length),
            minCost: 200,
            priority,
            memoryAdditions: {
                SI: sourceIndex,
                roads: true,
            },
        };
    })());
    this.constructSpawnRequests((() => {
        const sourceIndex = 1;
        const priority = (mostOptimalSource.index === sourceIndex ? 0 : 1) + this.creepsFromRoom.source1Harvester.length;
        const role = 'source2Harvester';
        if (spawnEnergyCapacity >= 800) {
            return {
                role,
                defaultParts: [CARRY],
                extraParts: [WORK, MOVE, WORK],
                partsMultiplier: 3,
                minCreeps: 1,
                minCost: 200,
                priority,
                memoryAdditions: {
                    SI: sourceIndex,
                    roads: true,
                },
            };
        }
        if (spawnEnergyCapacity >= 750) {
            return {
                role,
                defaultParts: [],
                extraParts: [WORK, MOVE, WORK],
                partsMultiplier: 3,
                minCreeps: 1,
                minCost: 200,
                priority,
                memoryAdditions: {
                    SI: sourceIndex,
                    roads: true,
                },
            };
        }
        if (spawnEnergyCapacity >= 600) {
            return {
                role,
                defaultParts: [MOVE, CARRY],
                extraParts: [WORK],
                partsMultiplier: 6,
                minCreeps: 1,
                minCost: 300,
                priority,
                memoryAdditions: {
                    SI: sourceIndex,
                    roads: true,
                },
            };
        }
        if (this.sourceContainers[sourceIndex]) {
            return {
                role,
                defaultParts: [MOVE],
                extraParts: [WORK],
                partsMultiplier: 6,
                minCreeps: 1,
                minCost: 150,
                priority,
                memoryAdditions: {
                    SI: sourceIndex,
                    roads: true,
                },
            };
        }
        return {
            role,
            defaultParts: [MOVE, CARRY],
            extraParts: [WORK],
            partsMultiplier: 6,
            minCreeps: undefined,
            maxCreeps: Math.min(3, this.sourcePositions[sourceIndex].length),
            minCost: 200,
            priority,
            memoryAdditions: {
                SI: sourceIndex,
                roads: true,
            },
        };
    })());
    this.constructSpawnRequests((() => {
        const priority = 0.5 + this.creepsFromRoom.hauler.length * 1.5;
        let requiredCarryParts = 10;
        if (!this.sourceLinks[0])
            requiredCarryParts += findCarryPartsRequired(this.sourcePaths[0].length * 2, 10);
        if (!this.sourceLinks[1])
            requiredCarryParts += findCarryPartsRequired(this.sourcePaths[1].length * 2, 10);
        if (this.controllerContainer) {
            let income;
            if (this.storage) {
                income = this.getPartsOfRoleAmount('controllerUpgrader', WORK);
            }
            else
                income = Math.min(this.getPartsOfRoleAmount('controllerUpgrader', WORK) * 0.75, this.sources.length * 0.75);
            requiredCarryParts += findCarryPartsRequired(this.upgradePathLength * 2, income);
        }
        const role = 'hauler';
        if (spawnEnergyCapacity >= 800) {
            return {
                role,
                defaultParts: [],
                extraParts: [CARRY, CARRY, MOVE],
                partsMultiplier: requiredCarryParts / 2,
                minCreeps: undefined,
                maxCreeps: Infinity,
                minCost: 150,
                priority,
                memoryAdditions: {
                    roads: true,
                },
            };
        }
        return {
            role,
            defaultParts: [],
            extraParts: [CARRY, MOVE],
            partsMultiplier: requiredCarryParts,
            minCreeps: undefined,
            maxCreeps: Infinity,
            minCost: 100,
            priority,
            memoryAdditions: {},
        };
    })());
    this.constructSpawnRequests((() => {
        var _a;
        if (!this.structures.extractor.length)
            return false;
        if (!this.storage)
            return false;
        if (this.storage.store.energy < 40000)
            return false;
        if (!this.terminal)
            return false;
        if (this.terminal.store.getFreeCapacity() <= 10000)
            return false;
        if (this.mineral.mineralAmount === 0)
            return false;
        let minCost = 900;
        if (spawnEnergyCapacity < minCost)
            return false;
        const role = 'mineralHarvester';
        return {
            role,
            defaultParts: [],
            extraParts: [WORK, WORK, MOVE, WORK, WORK, MOVE, WORK, MOVE, CARRY, CARRY, MOVE, WORK],
            partsMultiplier: ((_a = this.get('mineralHarvestPositions')) === null || _a === void 0 ? void 0 : _a.length) * 4,
            minCreeps: 1,
            minCost,
            priority: 10 + this.creepsFromRoom.mineralHarvester.length * 3,
            memoryAdditions: {
                roads: true,
            },
        };
    })());
    this.constructSpawnRequests((() => {
        if (!this.storage)
            return false;
        if (!this.hubLink && !this.terminal)
            return false;
        const role = 'hubHauler';
        return {
            role,
            defaultParts: [MOVE],
            extraParts: [CARRY],
            partsMultiplier: 8,
            minCreeps: 1,
            minCost: 300,
            priority: 7,
            memoryAdditions: {},
        };
    })());
    this.constructSpawnRequests((() => {
        const fastFillerPositions = this.get('fastFillerPositions');
        if (!fastFillerPositions.length)
            return false;
        let defaultParts = [CARRY, MOVE, CARRY];
        if (this.controller.level >= 7)
            defaultParts = [CARRY, CARRY, CARRY, MOVE, CARRY];
        const role = 'fastFiller';
        return {
            role,
            defaultParts,
            extraParts: [],
            partsMultiplier: 1,
            minCreeps: fastFillerPositions.length,
            minCost: 250,
            priority: 0.75,
            memoryAdditions: {},
        };
    })());
    let enemyAttackers = this.enemyAttackers;
    if (!this.structures.tower.length) {
        enemyAttackers = enemyAttackers.filter(function (creep) {
            return creep.owner.username !== 'Invader';
        });
    }
    let attackStrength = 0;
    for (const enemyAttacker of enemyAttackers)
        attackStrength += enemyAttacker.strength;
    this.constructSpawnRequests((() => {
        if (!enemyAttackers.length)
            return false;
        if (this.controller.safeMode)
            return false;
        const role = 'meleeDefender';
        return {
            role,
            defaultParts: [],
            extraParts: [ATTACK, ATTACK, MOVE],
            partsMultiplier: attackStrength,
            minCreeps: undefined,
            maxCreeps: 5,
            minCost: 210,
            priority: 6 + this.creepsFromRoom.meleeDefender.length,
            memoryAdditions: {
                roads: true,
            },
        };
    })());
    const estimatedIncome = this.estimateIncome();
    this.constructSpawnRequests((() => {
        if (this.find(FIND_MY_CONSTRUCTION_SITES).length === 0)
            return false;
        let priority = 10 + this.creepsFromRoom.builder.length;
        let partsMultiplier = 0;
        if (this.storage) {
            if (this.storage.store.getUsedCapacity(RESOURCE_ENERGY) >= builderSpawningWhenStorageThreshold)
                partsMultiplier += this.storage.store.getUsedCapacity(RESOURCE_ENERGY) / 8000;
        }
        else
            partsMultiplier += Math.floor(estimatedIncome / 3);
        const role = 'builder';
        if (!this.fastFillerContainerLeft && !this.fastFillerContainerRight) {
            return {
                role,
                defaultParts: [],
                extraParts: [WORK, CARRY, CARRY, MOVE],
                partsMultiplier: partsMultiplier,
                minCreeps: undefined,
                maxCreeps: Infinity,
                minCost: 250,
                priority,
                memoryAdditions: {
                    roads: true,
                },
            };
        }
        return {
            role,
            defaultParts: [],
            extraParts: [CARRY, MOVE, WORK, MOVE, CARRY, MOVE],
            partsMultiplier: partsMultiplier,
            minCreeps: undefined,
            maxCreeps: Infinity,
            minCost: 250,
            priority,
            memoryAdditions: {
                roads: true,
            },
        };
    })());
    this.constructSpawnRequests((() => {
        const priority = 8 + this.creepsFromRoom.maintainer.length;
        const repairTargets = [...this.structures.road, ...this.structures.container].filter(structure => structure.hitsMax * 0.2 >= structure.hits);
        const ramparts = this.structures.rampart.filter(rampart => rampart.hits < rampart.hitsMax);
        if (!ramparts.length && !repairTargets.length)
            return false;
        let partsMultiplier = 1;
        partsMultiplier += this.structures.road.length * 0.01;
        partsMultiplier += this.structures.container.length * 0.2;
        partsMultiplier += ramparts.length * 0.05;
        partsMultiplier += attackStrength * 0.5;
        if (this.storage)
            partsMultiplier += this.storage.store.getUsedCapacity(RESOURCE_ENERGY) / 20000;
        const role = 'maintainer';
        if (spawnEnergyCapacity >= 800) {
            return {
                role,
                defaultParts: [],
                extraParts: [CARRY, MOVE, WORK],
                partsMultiplier,
                minCreeps: undefined,
                maxCreeps: Infinity,
                minCost: 200,
                priority,
                memoryAdditions: {
                    roads: true,
                },
            };
        }
        return {
            role,
            defaultParts: [],
            extraParts: [MOVE, CARRY, MOVE, WORK],
            partsMultiplier,
            minCreeps: undefined,
            maxCreeps: Infinity,
            minCost: 250,
            priority,
            memoryAdditions: {},
        };
    })());
    this.constructSpawnRequests((() => {
        let partsMultiplier = 1;
        let maxCreeps = this.get('upgradePositions').length - 1;
        const priority = 9;
        if (enemyAttackers.length && this.controller.ticksToDowngrade > controllerDowngradeUpgraderNeed)
            return false;
        if (this.storage) {
            if (this.storage.store.getUsedCapacity(RESOURCE_ENERGY) >= upgraderSpawningWhenStorageThreshold)
                partsMultiplier = Math.pow(this.storage.store.getUsedCapacity(RESOURCE_ENERGY) / 10000, 2);
            else
                partsMultiplier = 0;
        }
        else {
            partsMultiplier += estimatedIncome * 0.75;
        }
        const controllerLink = this.controllerLink;
        if (controllerLink) {
            const hubLink = this.hubLink;
            const sourceLinks = this.sourceLinks;
            if (hubLink && sourceLinks.length) {
                let maxPartsMultiplier = 0;
                if (hubLink) {
                    const range = getRange(controllerLink.pos.x, hubLink.pos.x, controllerLink.pos.y, hubLink.pos.y);
                    maxPartsMultiplier += (controllerLink.store.getCapacity(RESOURCE_ENERGY) * 0.7) / range;
                }
                else
                    maxCreeps -= 1;
                for (const sourceLink of sourceLinks) {
                    if (!sourceLink)
                        continue;
                    const range = getRange(controllerLink.pos.x, sourceLink.pos.x, controllerLink.pos.y, sourceLink.pos.y);
                    maxPartsMultiplier += (controllerLink.store.getCapacity(RESOURCE_ENERGY) * 0.5) / range;
                }
                partsMultiplier = Math.min(partsMultiplier, maxPartsMultiplier);
            }
        }
        if (this.find(FIND_MY_CONSTRUCTION_SITES).length)
            partsMultiplier = 0;
        const threshold = 0.15;
        const role = 'controllerUpgrader';
        if (this.controllerContainer || controllerLink) {
            if (this.controller.level === 8) {
                if (this.controller.ticksToDowngrade < controllerDowngradeUpgraderNeed)
                    partsMultiplier = Math.max(partsMultiplier, 3);
                partsMultiplier = Math.min(Math.round(partsMultiplier / 3), 5);
                if (partsMultiplier === 0)
                    return false;
                return {
                    role,
                    defaultParts: [],
                    extraParts: [
                        WORK,
                        WORK,
                        MOVE,
                        CARRY,
                        WORK,
                        WORK,
                        MOVE,
                        WORK,
                        WORK,
                        WORK,
                        MOVE,
                        WORK,
                        WORK,
                        MOVE,
                        CARRY,
                        WORK,
                        MOVE,
                        WORK,
                        WORK,
                        MOVE,
                        WORK,
                        WORK,
                        MOVE,
                        CARRY,
                        WORK,
                        MOVE,
                    ],
                    partsMultiplier,
                    threshold,
                    minCreeps: 1,
                    minCost: 300,
                    priority,
                    memoryAdditions: {
                        roads: true,
                    },
                };
            }
            if (spawnEnergyCapacity >= 800) {
                if (this.controller.ticksToDowngrade < controllerDowngradeUpgraderNeed)
                    partsMultiplier = Math.max(partsMultiplier, 6);
                partsMultiplier = Math.round(partsMultiplier / 6);
                if (partsMultiplier === 0)
                    return false;
                return {
                    role,
                    defaultParts: [CARRY],
                    extraParts: [WORK, MOVE, WORK, WORK, WORK],
                    partsMultiplier,
                    threshold,
                    minCreeps: undefined,
                    maxCreeps,
                    minCost: 750,
                    priority,
                    memoryAdditions: {
                        roads: true,
                    },
                };
            }
            if (this.controller.ticksToDowngrade < controllerDowngradeUpgraderNeed)
                partsMultiplier = Math.max(partsMultiplier, 4);
            partsMultiplier = Math.round(partsMultiplier / 4);
            if (partsMultiplier === 0)
                return false;
            return {
                role,
                defaultParts: [CARRY],
                extraParts: [WORK, MOVE, WORK, WORK, WORK],
                partsMultiplier,
                threshold,
                minCreeps: undefined,
                maxCreeps,
                minCost: 200,
                priority,
                memoryAdditions: {
                    roads: true,
                },
            };
        }
        if (this.controller.ticksToDowngrade < controllerDowngradeUpgraderNeed)
            partsMultiplier = Math.max(partsMultiplier, 1);
        if (this.controller.level < 2)
            partsMultiplier = Math.max(partsMultiplier, 1);
        if (spawnEnergyCapacity >= 800) {
            return {
                role,
                defaultParts: [],
                extraParts: [CARRY, MOVE, WORK],
                partsMultiplier,
                threshold,
                maxCreeps: Infinity,
                minCost: 200,
                priority,
                memoryAdditions: {
                    roads: true,
                },
            };
        }
        return {
            role,
            defaultParts: [],
            extraParts: [MOVE, CARRY, MOVE, WORK],
            partsMultiplier,
            threshold,
            maxCreeps: Infinity,
            minCost: 250,
            priority,
            memoryAdditions: {},
        };
    })());
    let remoteHaulerNeed = 0;
    const minRemotePriority = 10;
    const remoteNamesByEfficacy = this.get('remoteNamesByEfficacy');
    for (let index = 0; index < remoteNamesByEfficacy.length; index += 1) {
        const remoteName = remoteNamesByEfficacy[index];
        const remoteNeeds = Memory.rooms[remoteName].needs;
        const totalRemoteNeed = Math.max(remoteNeeds[remoteNeedsIndex.source1RemoteHarvester], 0) +
            Math.max(remoteNeeds[remoteNeedsIndex.source2RemoteHarvester], 0) +
            Math.max(remoteNeeds[remoteNeedsIndex.remoteHauler], 0) +
            Math.max(remoteNeeds[remoteNeedsIndex.remoteReserver], 0) +
            Math.max(remoteNeeds[remoteNeedsIndex.remoteCoreAttacker], 0) +
            Math.max(remoteNeeds[remoteNeedsIndex.remoteDismantler], 0) +
            Math.max(remoteNeeds[remoteNeedsIndex.minDamage], 0) +
            Math.max(remoteNeeds[remoteNeedsIndex.minHeal], 0);
        if (totalRemoteNeed <= 0)
            continue;
        const remoteMemory = Memory.rooms[remoteName];
        const sourcesByEfficacy = findRemoteSourcesByEfficacy(remoteName);
        const possibleReservation = spawnEnergyCapacity >= 650;
        for (let index = 0; index < remoteMemory.sourceEfficacies.length; index += 1) {
            const income = (possibleReservation ? 10 : 5) -
                Math.floor(remoteMemory.needs[remoteNeedsIndex[remoteHarvesterRoles[index]]] * minHarvestWorkRatio);
            remoteHaulerNeed += findCarryPartsRequired(remoteMemory.sourceEfficacies[index], income);
        }
        const remotePriority = minRemotePriority + index;
        this.constructSpawnRequests((() => {
            var _a, _b;
            if (remoteNeeds[remoteNeedsIndex.source1RemoteHarvester] <= 0)
                return false;
            const role = 'source1RemoteHarvester';
            if (spawnEnergyCapacity >= 950) {
                return {
                    role,
                    defaultParts: [CARRY],
                    extraParts: [WORK, MOVE],
                    partsMultiplier: remoteNeeds[remoteNeedsIndex.source1RemoteHarvester],
                    groupComparator: this.creepsFromRoomWithRemote[remoteName].source1RemoteHarvester,
                    threshold: 0.1,
                    minCreeps: 1,
                    maxCreeps: Infinity,
                    maxCostPerCreep: 50 + 150 * 6,
                    minCost: 200,
                    priority: remotePriority - (sourcesByEfficacy[0] === 'source1' ? 0.1 : 0),
                    memoryAdditions: {
                        roads: true,
                    },
                };
            }
            return {
                role,
                defaultParts: [CARRY],
                extraParts: [WORK, WORK, MOVE],
                partsMultiplier: remoteNeeds[remoteNeedsIndex.source1RemoteHarvester],
                groupComparator: this.creepsFromRoomWithRemote[remoteName].source1RemoteHarvester,
                threshold: 0.1,
                minCreeps: undefined,
                maxCreeps: ((_b = (_a = global[remoteName]) === null || _a === void 0 ? void 0 : _a.source1HarvestPositions) === null || _b === void 0 ? void 0 : _b.length) || Infinity,
                maxCostPerCreep: 50 + 250 * 3,
                minCost: 300,
                priority: remotePriority - (sourcesByEfficacy[0] === 'source1' ? 0.1 : 0),
                memoryAdditions: {
                    roads: true,
                },
            };
        })());
        this.constructSpawnRequests((() => {
            var _a, _b;
            if (remoteNeeds[remoteNeedsIndex.source2RemoteHarvester] <= 0)
                return false;
            const role = 'source2RemoteHarvester';
            if (spawnEnergyCapacity >= 950) {
                return {
                    role,
                    defaultParts: [CARRY],
                    extraParts: [WORK, MOVE],
                    partsMultiplier: remoteNeeds[remoteNeedsIndex.source2RemoteHarvester],
                    groupComparator: this.creepsFromRoomWithRemote[remoteName].source2RemoteHarvester,
                    threshold: 0.1,
                    minCreeps: 1,
                    maxCreeps: Infinity,
                    maxCostPerCreep: 50 + 150 * 6,
                    minCost: 200,
                    priority: remotePriority - (sourcesByEfficacy[0] === 'source2' ? 0.1 : 0),
                    memoryAdditions: {
                        roads: true,
                    },
                };
            }
            return {
                role,
                defaultParts: [CARRY],
                extraParts: [WORK, WORK, MOVE],
                partsMultiplier: remoteNeeds[remoteNeedsIndex.source2RemoteHarvester],
                groupComparator: this.creepsFromRoomWithRemote[remoteName].source2RemoteHarvester,
                threshold: 0.1,
                minCreeps: undefined,
                maxCreeps: ((_b = (_a = global[remoteName]) === null || _a === void 0 ? void 0 : _a.source2HarvestPositions) === null || _b === void 0 ? void 0 : _b.length) || Infinity,
                maxCostPerCreep: 50 + 250 * 3,
                minCost: 300,
                priority: remotePriority - (sourcesByEfficacy[0] === 'source2' ? 0.1 : 0),
                memoryAdditions: {
                    roads: true,
                },
            };
        })());
        this.constructSpawnRequests((() => {
            let cost = 650;
            if (spawnEnergyCapacity < cost)
                return false;
            if (remoteNeeds[remoteNeedsIndex.remoteReserver] <= 0)
                return false;
            const role = 'remoteReserver';
            return {
                role,
                defaultParts: [],
                extraParts: [MOVE, CLAIM],
                partsMultiplier: 6,
                groupComparator: this.creepsFromRoomWithRemote[remoteName].remoteReserver,
                minCreeps: 1,
                maxCreeps: Infinity,
                minCost: cost,
                priority: remotePriority + 0.3,
                memoryAdditions: {},
            };
        })());
        this.constructSpawnRequests((() => {
            if (remoteNeeds[remoteNeedsIndex.minDamage] + remoteNeeds[remoteNeedsIndex.minHeal] <= 0)
                return false;
            const minCost = 400;
            const cost = 900;
            const extraParts = [RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, HEAL, MOVE];
            const rangedAttackStrength = RANGED_ATTACK_POWER * 2;
            const healStrength = HEAL_POWER;
            if (spawnEnergyCapacity < minCost)
                return false;
            if (rangedAttackStrength * (spawnEnergyCapacity / cost) < remoteNeeds[remoteNeedsIndex.minDamage] ||
                healStrength * (spawnEnergyCapacity / cost) < remoteNeeds[remoteNeedsIndex.minHeal]) {
                Memory.rooms[remoteName].abandoned = 1500;
                return false;
            }
            const partsMultiplier = Math.max(Math.floor(remoteNeeds[remoteNeedsIndex.minDamage] / rangedAttackStrength +
                remoteNeeds[remoteNeedsIndex.minHeal] / healStrength), 1);
            const role = 'remoteDefender';
            customLog('REMOTE DEFENDER FUNCTIONS', partsMultiplier +
                ', ' +
                remoteNeeds[remoteNeedsIndex.minDamage] +
                ', ' +
                remoteNeeds[remoteNeedsIndex.minHeal] +
                ', ' +
                remoteName +
                ', ' +
                rangedAttackStrength * (spawnEnergyCapacity / cost) +
                ', ' +
                healStrength * (spawnEnergyCapacity / cost) +
                ', ' +
                cost *
                    (remoteNeeds[remoteNeedsIndex.minDamage] / rangedAttackStrength +
                        remoteNeeds[remoteNeedsIndex.minHeal] / healStrength) +
                ', ' +
                this.creepsFromRoomWithRemote[remoteName].remoteDefender);
            return {
                role,
                defaultParts: [],
                extraParts,
                partsMultiplier,
                groupComparator: this.creepsFromRoomWithRemote[remoteName].remoteDefender,
                minCreeps: 1,
                minCost,
                priority: minRemotePriority - 3,
                memoryAdditions: {},
            };
        })());
        this.constructSpawnRequests((() => {
            if (remoteNeeds[remoteNeedsIndex.remoteCoreAttacker] <= 0)
                return false;
            const cost = 130;
            const extraParts = [ATTACK, MOVE];
            const minCost = cost * extraParts.length;
            const role = 'remoteCoreAttacker';
            return {
                role,
                defaultParts: [],
                extraParts,
                partsMultiplier: 50 / extraParts.length,
                groupComparator: this.creepsFromRoomWithRemote[remoteName].remoteCoreAttacker,
                minCreeps: 1,
                minCost,
                priority: minRemotePriority - 2,
                memoryAdditions: {},
            };
        })());
        this.constructSpawnRequests((() => {
            if (remoteNeeds[remoteNeedsIndex.remoteDismantler] <= 0)
                return false;
            const cost = 150;
            const extraParts = [WORK, MOVE];
            const role = 'remoteDismantler';
            return {
                role,
                defaultParts: [],
                extraParts,
                partsMultiplier: 50 / extraParts.length,
                groupComparator: this.creepsFromRoomWithRemote[remoteName].remoteDismantler,
                minCreeps: 1,
                minCost: cost * 2,
                priority: minRemotePriority - 1,
                memoryAdditions: {},
            };
        })());
    }
    this.constructSpawnRequests((() => {
        if (remoteHaulerNeed === 0)
            return false;
        partsMultiplier = remoteHaulerNeed;
        const role = 'remoteHauler';
        return {
            role,
            defaultParts: [],
            extraParts: [CARRY, MOVE],
            threshold: 0.1,
            partsMultiplier,
            maxCreeps: Infinity,
            minCost: 200,
            priority: minRemotePriority - 0.2,
            memoryAdditions: {},
        };
    })());
    this.constructSpawnRequests((() => {
        const role = 'scout';
        return {
            role,
            defaultParts: [MOVE],
            extraParts: [],
            partsMultiplier: 1,
            minCreeps: 2,
            maxCreeps: Infinity,
            minCost: 100,
            priority: 6,
            memoryAdditions: {},
        };
    })());
    if (this.memory.claimRequest) {
        const claimRequestNeeds = Memory.claimRequests[this.memory.claimRequest].needs;
        this.constructSpawnRequests((() => {
            if (claimRequestNeeds[claimRequestNeedsIndex.claimer] <= 0)
                return false;
            const role = 'claimer';
            return {
                role,
                defaultParts: [MOVE, MOVE, CLAIM, MOVE],
                extraParts: [],
                partsMultiplier: 1,
                minCreeps: 1,
                minCost: 750,
                priority: 8.1,
                memoryAdditions: {},
            };
        })());
        this.constructSpawnRequests((() => {
            if (claimRequestNeeds[claimRequestNeedsIndex.vanguard] <= 0)
                return false;
            const role = 'vanguard';
            return {
                role,
                defaultParts: [],
                extraParts: [CARRY, MOVE, WORK, MOVE, CARRY, MOVE],
                partsMultiplier: claimRequestNeeds[claimRequestNeedsIndex.vanguard],
                minCreeps: undefined,
                maxCreeps: Infinity,
                minCost: 250,
                priority: 8.2 + this.creepsFromRoom.vanguard.length,
                memoryAdditions: {},
            };
        })());
        this.constructSpawnRequests((() => {
            const minCost = 400;
            const cost = 900;
            const extraParts = [RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, HEAL, MOVE];
            const strengthOfParts = RANGED_ATTACK_POWER * 3 + HEAL_POWER * 1;
            if (spawnEnergyCapacity < minCost)
                return false;
            if (claimRequestNeeds[claimRequestNeedsIndex.vanguardDefender] <= 0)
                return false;
            if (strengthOfParts * (spawnEnergyCapacity / cost) <
                claimRequestNeeds[claimRequestNeedsIndex.vanguardDefender]) {
                Memory.claimRequests[this.memory.claimRequest].abandon = 20000;
                return false;
            }
            const partsMultiplier = Math.max(Math.floor(claimRequestNeeds[claimRequestNeedsIndex.vanguardDefender] / strengthOfParts) * 1.2, 1);
            if (claimRequestNeeds[claimRequestNeedsIndex.vanguardDefender] <= 0)
                return false;
            const role = 'vanguardDefender';
            return {
                role,
                defaultParts: [],
                extraParts,
                partsMultiplier,
                minCreeps: 1,
                minCost,
                priority: 8 + this.creepsFromRoom.vanguardDefender.length,
                memoryAdditions: {},
            };
        })());
    }
    if (this.memory.allyCreepRequest) {
        const allyCreepRequestNeeds = Memory.allyCreepRequests[this.memory.allyCreepRequest].needs;
        this.constructSpawnRequests((() => {
            if (allyCreepRequestNeeds[allyCreepRequestNeedsIndex.allyVanguard] <= 0)
                return false;
            const role = 'allyVanguard';
            return {
                role,
                defaultParts: [],
                extraParts: [CARRY, MOVE, WORK, MOVE, CARRY, MOVE],
                partsMultiplier: allyCreepRequestNeeds[allyCreepRequestNeedsIndex.allyVanguard],
                minCreeps: undefined,
                maxCreeps: Infinity,
                minCost: 250,
                priority: 10 + this.creepsFromRoom.allyVanguard.length,
                memoryAdditions: {},
            };
        })());
    }
    for (const roomName of this.memory.attackRequests) {
        Memory.attackRequests[roomName];
        const minCost = 300;
        const role = 'antifaAssaulter';
        this.constructSpawnRequests((() => {
            return {
                role,
                defaultParts: [],
                extraParts: [],
                partsMultiplier,
                minCreeps: 1,
                minCost,
                priority: 8 + this.creepsFromRoom.antifaAssaulter.length,
                memoryAdditions: {},
            };
        })());
    }
    if (Memory.cpuLogging)
        customLog('Spawn Request Manager', (Game.cpu.getUsed() - managerCPUStart).toFixed(2));
};

Room.prototype.spawnManager = function () {
    if (Memory.cpuLogging)
        var managerCPUStart = Game.cpu.getUsed();
    const inactiveSpawns = this.structures.spawn.filter(spawn => !spawn.spawning);
    if (!inactiveSpawns.length)
        return;
    this.spawnRequester();
    const requestsByPriority = Object.keys(this.spawnRequests).sort((a, b) => {
        return parseInt(a) - parseInt(b);
    });
    let spawnIndex = inactiveSpawns.length - 1;
    for (const priority of requestsByPriority) {
        if (spawnIndex < 0)
            break;
        const spawn = inactiveSpawns[spawnIndex];
        const spawnRequest = this.spawnRequests[priority];
        const testSpawnResult = spawn.advancedSpawn(spawnRequest);
        if (testSpawnResult !== OK) {
            customLog('Failed to spawn', `error: ${testSpawnResult}, role: ${spawnRequest.role}, cost: ${spawnRequest.cost}, body: (${spawnRequest.body.length}) ${spawnRequest.body}`, myColors.white, myColors.red);
            break;
        }
        spawnRequest.extraOpts.dryRun = false;
        spawn.advancedSpawn(spawnRequest);
        this.energyAvailable -= spawnRequest.cost;
        if (global.roomStats[this.name])
            global.roomStats[this.name].eosp += spawnRequest.cost;
        spawnIndex -= 1;
    }
    if (Memory.cpuLogging)
        customLog('Spawn Manager', (Game.cpu.getUsed() - managerCPUStart).toFixed(2), undefined, myColors.lightGrey);
};

Room.prototype.towerManager = function () {
    if (Memory.cpuLogging)
        var managerCPUStart = Game.cpu.getUsed();
    if (!this.structures.tower.length)
        return;
    this.towersAttackCreeps();
    this.towersHealCreeps();
    this.towersRepairRamparts();
    if (Memory.cpuLogging)
        customLog('Tower Manager', (Game.cpu.getUsed() - managerCPUStart).toFixed(2), undefined, myColors.lightGrey);
};
Room.prototype.towersHealCreeps = function () {
    const healTargets = this.myDamagedCreeps.concat(this.allyDamagedCreeps).filter(creep => {
        return creep.body.length > 1 && creep.hits < creep.hitsMax && !creep.isOnExit();
    });
    if (!healTargets.length)
        return;
    const target = healTargets[0];
    for (const tower of this.structures.tower) {
        if (tower.inactionable)
            continue;
        if (tower.store.energy <= tower.store.getCapacity(RESOURCE_ENERGY) * 0.5)
            continue;
        if (tower.heal(target) !== OK)
            continue;
        tower.inactionable = true;
        continue;
    }
};
Room.prototype.towersAttackCreeps = function () {
    const attackTargets = this.enemyCreeps.filter(function (creep) {
        return !creep.isOnExit();
    });
    if (!attackTargets.length)
        return;
    const attackTarget = attackTargets.sort(function (a, b) {
        return a.towerDamage - b.towerDamage;
    })[attackTargets.length - 1];
    if (attackTarget.towerDamage <= 0)
        return;
    for (const tower of this.structures.tower) {
        if (tower.inactionable)
            continue;
        if (tower.attack(attackTarget) !== OK)
            continue;
        tower.inactionable = true;
        continue;
    }
};
Room.prototype.towersRepairRamparts = function () {
    const ramparts = this.structures.rampart.filter(function (rampart) {
        return rampart.hits <= RAMPART_DECAY_AMOUNT;
    });
    if (!ramparts.length)
        return;
    for (const tower of this.structures.tower) {
        if (tower.inactionable)
            continue;
        const target = ramparts[ramparts.length - 1];
        if (!target)
            continue;
        if (tower.repair(target) !== OK)
            continue;
        tower.inactionable = true;
        ramparts.pop();
        continue;
    }
};

Room.prototype.remotePlanner = function (commune) {
    return true;
};
Room.prototype.clearOtherStructures = function () {
    if (Game.time % 100 !== 0)
        return;
    for (const wall of this.structures.constructedWall)
        wall.destroy();
    for (const structure of this.find(FIND_HOSTILE_STRUCTURES))
        structure.destroy();
};
Room.prototype.remoteConstructionPlacement = function () { };
Room.prototype.communeConstructionPlacement = function () {
    if (!this.memory.planned)
        return;
    if (Game.time % Math.floor(Math.random() * 100) !== 0)
        return;
    if (global.constructionSitesCount === 100)
        return;
    if (this.find(FIND_MY_CONSTRUCTION_SITES).length > 2)
        return;
    for (const stampType in stamps) {
        const stamp = stamps[stampType];
        for (const packedStampAnchor of this.memory.stampAnchors[stampType]) {
            const stampAnchor = unpackAsPos(packedStampAnchor);
            for (const structureType in stamp.structures) {
                if (structureType === 'empty')
                    continue;
                if (this.structures[structureType].length +
                    this.cSites[structureType].length >=
                    CONTROLLER_STRUCTURES[structureType][this.controller.level])
                    continue;
                if (structureType === STRUCTURE_RAMPART &&
                    (!this.storage || this.controller.level < 4 || this.storage.store.energy < 30000))
                    continue;
                if (structureType === STRUCTURE_ROAD && this.energyCapacityAvailable < 800)
                    continue;
                for (const pos of stamp.structures[structureType]) {
                    const x = pos.x + stampAnchor.x - stamp.offset;
                    const y = pos.y + stampAnchor.y - stamp.offset;
                    this.createConstructionSite(x, y, structureType);
                }
            }
        }
    }
    if (Memory.roomVisuals)
        this.visual.connectRoads();
};

function constructionManager(room) {
    if (Memory.cpuLogging)
        var managerCPUStart = Game.cpu.getUsed();
    if (!room.memory.planned)
        basePlanner(room);
    manageControllerStructures();
    function manageControllerStructures() {
        const centerUpgradePos = room.get('centerUpgradePos');
        if (!centerUpgradePos)
            return;
        if (room.controller.level >= 5) {
            const controllerContainer = room.controllerContainer;
            if (controllerContainer)
                controllerContainer.destroy();
            room.createConstructionSite(centerUpgradePos, STRUCTURE_LINK);
            return;
        }
        room.createConstructionSite(centerUpgradePos, STRUCTURE_CONTAINER);
    }
    room.clearOtherStructures();
    room.communeConstructionPlacement();
    if (Memory.cpuLogging)
        customLog('Construction Manager', `CPU: ${(Game.cpu.getUsed() - managerCPUStart).toFixed(2)}`, undefined, myColors.lightGrey);
}

Room.prototype.defenceManager = function () {
    if (Memory.cpuLogging)
        var managerCPUStart = Game.cpu.getUsed();
    this.advancedActivateSafeMode();
    this.manageRampartPublicity();
    if (Memory.cpuLogging)
        customLog('Defence Manager', (Game.cpu.getUsed() - managerCPUStart).toFixed(2), undefined, myColors.lightGrey);
};
Room.prototype.manageRampartPublicity = function () {
    const enemyAttackers = this.enemyAttackers.filter(function (creep) {
        return !creep.isOnExit();
    });
    if (!enemyAttackers.length) {
        if (!Memory.publicRamparts)
            return;
        if (Game.time % Math.floor(Math.random() * 50) !== 0)
            return;
        let intents = 0;
        for (const rampart of this.structures.rampart) {
            if (intents >= 10)
                return;
            if (rampart.isPublic)
                continue;
            rampart.setPublic(true);
            intents += 1;
        }
        return;
    }
    for (const rampart of this.structures.rampart)
        if (rampart.isPublic)
            rampart.setPublic(false);
};
Room.prototype.advancedActivateSafeMode = function () {
    if (this.controller.safeModeCooldown)
        return;
    if (this.controller.safeModeAvailable === 0)
        return;
    if (this.controller.upgradeBlocked > 0)
        return;
    const enemyAttackers = this.enemyAttackers.filter(function (creep) {
        return !creep.isOnExit();
    });
    const nonInvaderAttackers = enemyAttackers.filter(enemyAttacker => enemyAttacker.owner.username !== 'Invader');
    if (!nonInvaderAttackers.length)
        return;
    const eventLog = this.getEventLog();
    for (const eventItem of eventLog) {
        if (eventItem.event !== EVENT_ATTACK)
            continue;
        const attackTarget = findObjectWithID(eventItem.data.targetId);
        if (!(attackTarget instanceof Structure))
            continue;
        if (safemodeTargets.includes(attackTarget.structureType)) {
            this.controller.activateSafeMode();
            return;
        }
    }
};

Room.prototype.linkManager = function () {
    if (!this.storage)
        return;
    const sourceLinks = this.sourceLinks;
    const receiverLinks = [this.fastFillerLink, this.hubLink, this.controllerLink];
    this.sourcesToReceivers(sourceLinks, receiverLinks);
    this.hubToFastFiller(this.hubLink, this.fastFillerLink);
    this.hubToController(this.hubLink, this.controllerLink);
};
Room.prototype.sourcesToReceivers = function (sourceLinks, receiverLinks) {
    for (const sourceLink of sourceLinks) {
        if (!sourceLink)
            continue;
        if (sourceLink.store.getCapacity(RESOURCE_ENERGY) - sourceLink.store.energy > 100)
            continue;
        for (const receiverLink of receiverLinks) {
            if (!receiverLink)
                continue;
            if (receiverLink.store.energy > receiverLink.store.getCapacity(RESOURCE_ENERGY) * 0.25)
                continue;
            sourceLink.transferEnergy(receiverLink);
            receiverLink.store.energy += sourceLink.store.energy;
            sourceLink.store.energy -= receiverLink.store.getCapacity(RESOURCE_ENERGY) - receiverLink.store.energy;
            break;
        }
    }
};
Room.prototype.hubToFastFiller = function (hubLink, fastFillerLink) {
    if (!hubLink || !fastFillerLink)
        return;
    if (hubLink.store.getCapacity(RESOURCE_ENERGY) - hubLink.store.energy > 100)
        return;
    if (fastFillerLink.store.energy > fastFillerLink.store.getCapacity(RESOURCE_ENERGY) * 0.25)
        return;
    hubLink.transferEnergy(fastFillerLink);
    fastFillerLink.store.energy += hubLink.store.energy;
    hubLink.store.energy -= fastFillerLink.store.getCapacity(RESOURCE_ENERGY) - fastFillerLink.store.energy;
};
Room.prototype.hubToController = function (hubLink, controllerLink) {
    if (this.controller.ticksToDowngrade > 10000 &&
        this.storage.store.energy < upgraderSpawningWhenStorageThreshold - 30000)
        return;
    if (!hubLink || !controllerLink)
        return;
    if (hubLink.store.getCapacity(RESOURCE_ENERGY) - hubLink.store.energy > 100)
        return;
    if (controllerLink.store.energy > controllerLink.store.getCapacity(RESOURCE_ENERGY) * 0.25)
        return;
    hubLink.transferEnergy(controllerLink);
    controllerLink.store.energy += hubLink.store.energy;
    hubLink.store.energy -= controllerLink.store.getCapacity(RESOURCE_ENERGY) - controllerLink.store.energy;
};

Room.prototype.allyCreepRequestManager = function () {
    if (Memory.cpuLogging)
        var managerCPUStart = Game.cpu.getUsed();
    if (this.memory.allyCreepRequest) {
        Memory.allyCreepRequests[this.memory.allyCreepRequest].needs[allyCreepRequestNeedsIndex.allyVanguard] = 20;
        const request = Game.rooms[this.memory.allyCreepRequest];
        if (!request)
            return;
        if (request.controller && request.controller.owner && !Memory.allyList.includes(request.controller.owner.username)) {
            Memory.allyCreepRequests[this.memory.allyCreepRequest].needs[allyCreepRequestNeedsIndex.allyVanguard] += 1;
            return;
        }
        if (!request.allyCSites.length) {
            delete Memory.allyCreepRequests[this.memory.allyCreepRequest];
            delete this.memory.allyCreepRequest;
            return;
        }
        if (request.enemyCreeps.length) {
            Memory.allyCreepRequests[this.memory.allyCreepRequest].abandon = 20000;
            Memory.allyCreepRequests[this.memory.allyCreepRequest].needs[allyCreepRequestNeedsIndex.allyVanguard] = 0;
            delete this.memory.allyCreepRequest;
        }
    }
    if (Memory.cpuLogging)
        customLog('Ally Creep Request Manager', (Game.cpu.getUsed() - managerCPUStart).toFixed(2), undefined, myColors.lightGrey);
};

Room.prototype.claimRequestManager = function () {
    if (Memory.cpuLogging)
        var managerCPUStart = Game.cpu.getUsed();
    if (this.memory.claimRequest) {
        if (Memory.claimRequests[this.memory.claimRequest].abandon > 0) {
            delete this.memory.claimRequest;
            return;
        }
        if (this.energyCapacityAvailable < 750) {
            delete this.memory.claimRequest;
            return;
        }
        const claimTarget = Game.rooms[this.memory.claimRequest];
        if (!claimTarget || !claimTarget.controller.my) {
            Memory.claimRequests[this.memory.claimRequest].needs[claimRequestNeedsIndex.claimer] += 1;
            return;
        }
        if (claimTarget.structures.spawn.length) {
            delete Memory.claimRequests[this.memory.claimRequest];
            delete this.memory.claimRequest;
            return;
        }
        Memory.claimRequests[this.memory.claimRequest].needs[claimRequestNeedsIndex.vanguard] = claimTarget.structures
            .spawn.length
            ? 0
            : 20;
        Memory.claimRequests[this.memory.claimRequest].needs[claimRequestNeedsIndex.vanguardDefender] = 0;
        for (const enemyCreep of claimTarget.enemyCreeps) {
            Memory.claimRequests[this.memory.claimRequest].needs[claimRequestNeedsIndex.vanguardDefender] +=
                enemyCreep.strength;
        }
        return;
    }
    if (Memory.cpuLogging)
        customLog('Claim Request Manager', (Game.cpu.getUsed() - managerCPUStart).toFixed(2), undefined, myColors.lightGrey);
};

function communeManager(room) {
    constructionManager(room);
    room.defenceManager();
    room.towerManager();
    marketManager(room);
    room.linkManager();
    room.claimRequestManager();
    room.allyCreepRequestManager();
    room.spawnManager();
}

function packCoord(coord) {
    return String.fromCharCode(((coord.x << 6) | coord.y) + 65);
}
function unpackCoord(char) {
    const xShiftedSixOrY = char.charCodeAt(0) - 65;
    return {
        x: (xShiftedSixOrY & 0b111111000000) >>> 6,
        y: xShiftedSixOrY & 0b000000111111,
    };
}
global.packedRoomNames = global.packedRoomNames || {};
global.unpackedRoomNames = global.unpackedRoomNames || {};
function packRoomName(roomName) {
    if (global.packedRoomNames[roomName] === undefined) {
        const coordinateRegex = /(E|W)(\d+)(N|S)(\d+)/g;
        const match = coordinateRegex.exec(roomName);
        const xDir = match[1];
        const x = Number(match[2]);
        const yDir = match[3];
        const y = Number(match[4]);
        let quadrant;
        if (xDir === 'W') {
            if (yDir === 'N') {
                quadrant = 0;
            }
            else {
                quadrant = 1;
            }
        }
        else if (yDir === 'N') {
            quadrant = 2;
        }
        else {
            quadrant = 3;
        }
        const num = ((quadrant << 12) | (x << 6) | y) + 65;
        const char = String.fromCharCode(num);
        global.packedRoomNames[roomName] = char;
        global.unpackedRoomNames[char] = roomName;
    }
    return global.packedRoomNames[roomName];
}
function unpackRoomName(char) {
    if (global.unpackedRoomNames[char] === undefined) {
        const num = char.charCodeAt(0) - 65;
        const { q, x, y } = {
            q: (num & 0b11000000111111) >>> 12,
            x: (num & 0b00111111000000) >>> 6,
            y: num & 0b00000000111111,
        };
        let roomName;
        switch (q) {
            case 0:
                roomName = `W${x}N${y}`;
                break;
            case 1:
                roomName = `W${x}S${y}`;
                break;
            case 2:
                roomName = `E${x}N${y}`;
                break;
            case 3:
                roomName = `E${x}S${y}`;
                break;
            default:
                roomName = 'ERROR';
        }
        global.packedRoomNames[roomName] = char;
        global.unpackedRoomNames[char] = roomName;
    }
    return global.unpackedRoomNames[char];
}
function packPos(pos) {
    return packCoord(pos) + packRoomName(pos.roomName);
}
function unpackPos(chars) {
    const { x, y } = unpackCoord(chars[0]);
    return new RoomPosition(x, y, unpackRoomName(chars[1]));
}
function packPosList(posList) {
    let str = '';
    for (let i = 0; i < posList.length; ++i) {
        str += packPos(posList[i]);
    }
    return str;
}
function unpackPosList(chars) {
    const posList = [];
    for (let i = 0; i < chars.length; i += 2) {
        posList.push(unpackPos(chars.substr(i, 2)));
    }
    return posList;
}

Creep.prototype.preTickManager = function () { };
Creep.prototype.isDying = function () {
    if (this.memory.dying)
        return true;
    if (!this.ticksToLive)
        return false;
    if (this.ticksToLive > this.body.length * CREEP_SPAWN_TIME)
        return false;
    return (this.memory.dying = true);
};
Creep.prototype.advancedTransfer = function (target, resourceType = RESOURCE_ENERGY, amount) {
    if (this.pos.getRangeTo(target.pos) > 1) {
        this.createMoveRequest({
            origin: this.pos,
            goal: { pos: target.pos, range: 1 },
            avoidEnemyRanges: true,
        });
        return false;
    }
    if (this.movedResource)
        return false;
    const transferResult = this.transfer(target, resourceType, amount);
    this.message += transferResult;
    if (transferResult === OK || transferResult === ERR_NOT_ENOUGH_RESOURCES) {
        this.movedResource = true;
        return true;
    }
    return false;
};
Creep.prototype.advancedWithdraw = function (target, resourceType = RESOURCE_ENERGY, amount) {
    if (this.pos.getRangeTo(target.pos) > 1) {
        this.createMoveRequest({
            origin: this.pos,
            goal: { pos: target.pos, range: 1 },
            avoidEnemyRanges: true,
        });
        return false;
    }
    if (this.movedResource)
        return false;
    const withdrawResult = this.withdraw(target, resourceType, amount);
    this.message += withdrawResult;
    if (withdrawResult === OK || withdrawResult === ERR_FULL) {
        this.movedResource = true;
        return true;
    }
    return false;
};
Creep.prototype.advancedPickup = function (target) {
    if (this.pos.getRangeTo(target.pos) > 1) {
        this.createMoveRequest({
            origin: this.pos,
            goal: { pos: target.pos, range: 1 },
            avoidEnemyRanges: true,
        });
        return false;
    }
    if (this.movedResource)
        return false;
    const pickupResult = this.pickup(target);
    this.message += pickupResult;
    if (pickupResult === OK || pickupResult === ERR_FULL) {
        this.movedResource = true;
        return true;
    }
    return false;
};
Creep.prototype.advancedHarvestSource = function (source) {
    this.say('⛏️');
    if (this.harvest(source) !== OK)
        return false;
    this.worked = true;
    const energyHarvested = Math.min(this.parts.work * HARVEST_POWER, source.energy);
    if (global.roomStats[this.room.name])
        global.roomStats[this.room.name].eih += energyHarvested;
    this.say(`${energyHarvested}`);
    return true;
};
Creep.prototype.advancedUpgradeController = function () {
    const { room } = this;
    const controllerStructure = room.controllerContainer || room.controllerLink;
    if (controllerStructure) {
        if (!this.memory.packedPos) {
            const upgradePositions = room.get('upgradePositions');
            const usedUpgradePositions = room.get('usedUpgradePositions');
            if (!usedUpgradePositions)
                return false;
            let packedPos;
            for (const pos of upgradePositions) {
                packedPos = pack(pos);
                if (usedUpgradePositions.has(packedPos))
                    continue;
                this.memory.packedPos = packedPos;
                usedUpgradePositions.add(packedPos);
                break;
            }
        }
        if (!this.memory.packedPos)
            return false;
        const upgradePos = unpackAsRoomPos(this.memory.packedPos, room.name);
        const upgradePosRange = getRange(this.pos.x, upgradePos.x, this.pos.y, upgradePos.y);
        if (upgradePosRange > 0) {
            this.createMoveRequest({
                origin: this.pos,
                goal: {
                    pos: upgradePos,
                    range: 0,
                },
                avoidEnemyRanges: true,
            });
            this.message += '➡️';
        }
        const workPartCount = this.parts.work;
        const controllerRange = getRange(this.pos.x, room.controller.pos.x, this.pos.y, room.controller.pos.y);
        if (controllerRange <= 3 && this.store.energy > 0) {
            if (this.upgradeController(room.controller) === OK) {
                this.store.energy -= workPartCount;
                const controlPoints = workPartCount * UPGRADE_CONTROLLER_POWER;
                if (global.roomStats[this.room.name])
                    global.roomStats[this.room.name].eou += controlPoints;
                this.message += `🔋${controlPoints}`;
            }
        }
        const controllerStructureRange = getRange(this.pos.x, controllerStructure.pos.x, this.pos.y, controllerStructure.pos.y);
        if (controllerStructureRange <= 3) {
            if (this.store.energy > 0 &&
                controllerStructure.structureType === STRUCTURE_CONTAINER &&
                controllerStructure.hitsMax - controllerStructure.hits >= workPartCount * REPAIR_POWER) {
                if (this.repair(controllerStructure) === OK) {
                    const energySpentOnRepairs = Math.min(workPartCount, (controllerStructure.hitsMax - controllerStructure.hits) / REPAIR_POWER);
                    this.store.energy -= workPartCount;
                    if (global.roomStats[this.room.name])
                        global.roomStats[this.room.name].eoro += energySpentOnRepairs;
                    this.message += `🔧${energySpentOnRepairs * REPAIR_POWER}`;
                }
            }
            if (controllerStructureRange <= 1 && this.store.energy <= 0) {
                if (this.withdraw(controllerStructure, RESOURCE_ENERGY) !== OK)
                    return false;
                this.store.energy += Math.min(this.store.getCapacity(), controllerStructure.store.energy);
                controllerStructure.store.energy -= this.store.energy;
                this.message += `⚡`;
            }
        }
        this.say(this.message);
        return true;
    }
    if (this.needsResources()) {
        if (!this.memory.reservations || !this.memory.reservations.length)
            this.reserveWithdrawEnergy();
        if (!this.fulfillReservation()) {
            this.say(this.message);
            return false;
        }
        this.reserveWithdrawEnergy();
        if (!this.fulfillReservation()) {
            this.say(this.message);
            return false;
        }
        if (this.needsResources())
            return false;
        this.createMoveRequest({
            origin: this.pos,
            goal: { pos: room.controller.pos, range: 3 },
            avoidEnemyRanges: true,
        });
        return false;
    }
    if (this.pos.getRangeTo(room.controller.pos) > 3) {
        this.createMoveRequest({
            origin: this.pos,
            goal: { pos: room.controller.pos, range: 3 },
            avoidEnemyRanges: true,
        });
        return false;
    }
    if (this.upgradeController(room.controller) === OK) {
        if (global.roomStats[this.room.name])
            global.roomStats[this.room.name].eou += this.parts.work;
        this.say(`🔋${this.parts.work}`);
        return true;
    }
    return false;
};
Creep.prototype.advancedBuildCSite = function () {
    const { room } = this;
    const cSiteTarget = room.cSiteTarget;
    if (!cSiteTarget)
        return false;
    this.say('ABCS');
    if (getRange(this.pos.x, cSiteTarget.pos.x, this.pos.y, cSiteTarget.pos.y) > 3) {
        this.say('➡️CS');
        this.createMoveRequest({
            origin: this.pos,
            goal: { pos: cSiteTarget.pos, range: 3 },
            avoidEnemyRanges: true,
        });
        return true;
    }
    const buildResult = this.build(cSiteTarget);
    if (buildResult === OK) {
        const energySpentOnConstruction = Math.min(this.parts.work * BUILD_POWER, (cSiteTarget.progressTotal - cSiteTarget.progress) * BUILD_POWER);
        if (global.roomStats[this.room.name])
            global.roomStats[this.room.name].eob += Math.min(this.parts.work * BUILD_POWER, (cSiteTarget.progressTotal - cSiteTarget.progress) * BUILD_POWER);
        this.say(`🚧${energySpentOnConstruction}`);
        return true;
    }
    return true;
};
Creep.prototype.advancedBuildAllyCSite = function () {
    const { room } = this;
    if (!room.memory.cSiteTargetID) {
        room.findAllyCSiteTargetID(this);
    }
    let cSiteTarget = findObjectWithID(room.memory.cSiteTargetID);
    if (!cSiteTarget) {
        room.findAllyCSiteTargetID(this);
    }
    cSiteTarget = findObjectWithID(room.memory.cSiteTargetID);
    if (!cSiteTarget)
        return false;
    this.say('ABCS');
    if (getRange(this.pos.x, cSiteTarget.pos.x, this.pos.y, cSiteTarget.pos.y) > 3) {
        this.say('➡️CS');
        this.createMoveRequest({
            origin: this.pos,
            goal: { pos: cSiteTarget.pos, range: 3 },
            avoidEnemyRanges: true,
        });
        return true;
    }
    const buildResult = this.build(cSiteTarget);
    if (buildResult === OK) {
        const energySpentOnConstruction = Math.min(this.parts.work * BUILD_POWER, (cSiteTarget.progressTotal - cSiteTarget.progress) * BUILD_POWER);
        if (global.roomStats[this.room.name])
            global.roomStats[this.room.name].eob += Math.min(this.parts.work * BUILD_POWER, (cSiteTarget.progressTotal - cSiteTarget.progress) * BUILD_POWER);
        this.say(`🚧${energySpentOnConstruction}`);
        return true;
    }
    return true;
};
Creep.prototype.findRampartRepairTarget = function (workPartCount) {
    const { room } = this;
    const repairTarget = findObjectWithID(this.memory.repairTarget);
    const rampartRepairExpectation = (workPartCount * REPAIR_POWER * this.store.getCapacity()) / CARRY_CAPACITY;
    if (repairTarget && repairTarget.hits < this.memory.quota + rampartRepairExpectation)
        return repairTarget;
    const ramparts = room.structures.rampart;
    if (!ramparts.length)
        return false;
    for (let quota = this.memory.quota || rampartRepairExpectation; quota < ramparts[0].hitsMax; quota += rampartRepairExpectation) {
        const rampartsUnderQuota = ramparts.filter(r => r.hits < quota);
        if (!rampartsUnderQuota.length)
            continue;
        this.memory.quota = quota;
        return this.pos.findClosestByPath(rampartsUnderQuota, {
            ignoreCreeps: true,
            range: 3,
        });
    }
    return false;
};
Creep.prototype.findRepairTarget = function (excludedIDs = new Set()) {
    const { room } = this;
    const possibleRepairTargets = [...room.structures.road, ...room.structures.container];
    const viableRepairTargets = possibleRepairTargets.filter(function (structure) {
        if (excludedIDs.has(structure.id))
            return false;
        return structure.hitsMax * 0.2 >= structure.hits;
    });
    this.say('FRT');
    if (!viableRepairTargets.length)
        return false;
    return this.pos.findClosestByPath(viableRepairTargets, {
        ignoreCreeps: true,
        range: 3,
    });
};
Creep.prototype.findOptimalSourceName = function () {
    const { room } = this;
    this.say('FOSN');
    if (this.memory.SI)
        return true;
    if (!room.anchor)
        return false;
    let creepThreshold = 1;
    while (creepThreshold < 4) {
        for (const source of room.sourcesByEfficacy) {
            const { index } = source;
            if (Math.min(creepThreshold, room.sourcePositions[index].length) - room.creepsOfSourceAmount[index] >
                0) {
                this.memory.SI = index;
                return true;
            }
        }
        creepThreshold += 1;
    }
    return false;
};
Creep.prototype.findSourcePos = function (index) {
    const { room } = this;
    this.say('FSHP');
    if (this.memory.packedPos)
        return true;
    const usedSourceCoords = room.usedSourceCoords[index];
    const openSourcePositions = room.sourcePositions[index].filter(pos => !usedSourceCoords.has(pack(pos)));
    if (!openSourcePositions.length)
        return false;
    const packedPos = pack(openSourcePositions[0]);
    this.memory.packedPos = packedPos;
    room._usedSourceCoords[index].add(packedPos);
    return true;
};
Creep.prototype.findMineralHarvestPos = function () {
    const { room } = this;
    this.say('FMHP');
    if (this.memory.packedPos)
        return true;
    const anchor = room.anchor || this.pos;
    const usedHarvestPositions = room.get('usedMineralHarvestPositions');
    const closestHarvestPos = room.get('closestMineralHarvestPos');
    let packedPos = pack(closestHarvestPos);
    if (closestHarvestPos) {
        packedPos = pack(closestHarvestPos);
        if (!usedHarvestPositions.has(packedPos)) {
            this.memory.packedPos = packedPos;
            usedHarvestPositions.add(packedPos);
            return true;
        }
    }
    const harvestPositions = room.get('mineralHarvestPositions');
    const openHarvestPositions = harvestPositions.filter(pos => !usedHarvestPositions.has(pack(pos)));
    if (!openHarvestPositions.length)
        return false;
    openHarvestPositions.sort((a, b) => getRange(anchor.x, anchor.y, a.x, a.y) - getRange(anchor.x, anchor.y, b.x, b.y));
    packedPos = pack(openHarvestPositions[0]);
    this.memory.packedPos = packedPos;
    usedHarvestPositions.add(packedPos);
    return true;
};
Creep.prototype.findFastFillerPos = function () {
    const { room } = this;
    this.say('FFP');
    if (this.memory.packedPos)
        return true;
    const usedFastFillerPositions = room.get('usedFastFillerPositions');
    const fastFillerPositions = room.get('fastFillerPositions');
    const openFastFillerPositions = fastFillerPositions.filter(pos => !usedFastFillerPositions.has(pack(pos)));
    if (!openFastFillerPositions.length)
        return false;
    const packedPos = pack(findClosestPos(this.pos, openFastFillerPositions));
    this.memory.packedPos = packedPos;
    usedFastFillerPositions.add(packedPos);
    return true;
};
Creep.prototype.needsNewPath = function (goalPos, cacheAmount, path) {
    if (!path)
        return true;
    if (path.length === 0)
        return true;
    if (!this.memory.lastCache)
        return true;
    if (this.memory.lastCache + cacheAmount <= Game.time)
        return true;
    if (path[0].roomName !== this.room.name)
        return true;
    if (!this.memory.goalPos)
        return true;
    if (!arePositionsEqual(unpackPos(this.memory.goalPos), goalPos))
        return true;
    if (this.pos.getRangeTo(path[0]) > 1)
        return true;
    return false;
};
Creep.prototype.createMoveRequest = function (opts) {
    const { room } = this;
    if (this.fatigue > 0)
        return false;
    if (this.spawning)
        return false;
    if (this.moveRequest)
        return false;
    if (!opts.cacheAmount)
        opts.cacheAmount = internationalManager.defaultCacheAmount;
    let path;
    if (this.memory.path) {
        path = unpackPosList(this.memory.path);
        while (path[0] && arePositionsEqual(this.pos, path[0])) {
            path.shift();
        }
    }
    const needsNewPathResult = this.needsNewPath(opts.goal.pos, opts.cacheAmount, path);
    if (needsNewPathResult) {
        opts.creep = this;
        opts.avoidImpassibleStructures = true;
        opts.avoidStationaryPositions = true;
        opts.avoidNotMyCreeps = true;
        path = room.advancedFindPath(opts);
        path.splice(opts.cacheAmount);
        this.memory.lastCache = Game.time;
        if (Memory.roomVisuals)
            room.visual.text('NP', path[0], {
                align: 'center',
                color: myColors.lightBlue,
            });
        while (path[0] && arePositionsEqual(this.pos, path[0])) {
            path.shift();
        }
    }
    if (!path.length)
        return false;
    if (Memory.roomVisuals)
        room.pathVisual(path, 'lightBlue');
    const packedPos = pack(path[0]);
    room.moveRequests[packedPos].push(this.name);
    this.moveRequest = packedPos;
    this.pathOpts = opts;
    this.memory.goalPos = packPos(opts.goal.pos);
    this.memory.path = packPosList(path);
    return true;
};
Creep.prototype.findShovePositions = function (avoidPackedPositions) {
    const { room } = this;
    const x = this.pos.x;
    const y = this.pos.y;
    const adjacentPackedPositions = [
        packXY(x - 1, y - 1),
        packXY(x - 1, y),
        packXY(x - 1, y + 1),
        packXY(x, y - 1),
        packXY(x, y + 1),
        packXY(x + 1, y - 1),
        packXY(x + 1, y + 1),
        packXY(x + 1, y - 1),
    ];
    const shovePositions = [];
    const terrain = room.getTerrain();
    for (let index = 0; index < adjacentPackedPositions.length; index++) {
        const packedPos = adjacentPackedPositions[index];
        if (room.creepPositions[packedPos])
            continue;
        if (avoidPackedPositions.has(packedPos))
            continue;
        let coord = unpackAsPos(packedPos);
        if (coord.x < 1 || coord.x >= roomDimensions - 1 || coord.y < 1 || coord.y >= roomDimensions - 1)
            continue;
        let pos = new RoomPosition(coord.x, coord.y, room.name);
        if (terrain.get(pos.x, pos.y) === TERRAIN_MASK_WALL)
            continue;
        let hasImpassibleStructure;
        for (const structure of pos.lookFor(LOOK_STRUCTURES))
            if (impassibleStructureTypes.includes(structure.structureType)) {
                hasImpassibleStructure = true;
                break;
            }
        if (hasImpassibleStructure)
            continue;
        for (const cSite of pos.lookFor(LOOK_CONSTRUCTION_SITES)) {
            if (!cSite.my && !Memory.allyList.includes(cSite.owner.username))
                continue;
            if (impassibleStructureTypes.includes(cSite.structureType)) {
                hasImpassibleStructure = true;
                break;
            }
        }
        if (hasImpassibleStructure)
            continue;
        shovePositions.push(pos);
    }
    return shovePositions;
};
Creep.prototype.shove = function (shoverPos) {
    const { room } = this;
    const shovePositions = this.findShovePositions(new Set([pack(shoverPos), pack(this.pos)]));
    if (!shovePositions.length)
        return false;
    let goalPos;
    if (this.memory.goalPos) {
        goalPos = unpackPos(this.memory.goalPos);
        goalPos = shovePositions.sort((a, b) => {
            return getRange(goalPos.x, a.x, goalPos.y, a.y) - getRange(goalPos.x, b.x, goalPos.y, b.y);
        })[0];
    }
    else
        goalPos = shovePositions[0];
    const packedPos = pack(goalPos);
    room.moveRequests[packedPos].push(this.name);
    this.moveRequest = packedPos;
    if (Memory.roomVisuals)
        room.visual.circle(this.pos, {
            fill: '',
            stroke: myColors.red,
            radius: 0.5,
            strokeWidth: 0.15,
        });
    if (!this.moveRequest)
        return false;
    if (Memory.roomVisuals) {
        room.visual.circle(this.pos, {
            fill: '',
            stroke: myColors.yellow,
            radius: 0.5,
            strokeWidth: 0.15,
        });
        room.visual.line(this.pos, unpackAsRoomPos(this.moveRequest, this.room.name), {
            color: myColors.yellow,
        });
    }
    this.recurseMoveRequest();
    return true;
};
Creep.prototype.runMoveRequest = function () {
    const { room } = this;
    if (!room.moveRequests[this.moveRequest])
        return false;
    if (this.move(this.pos.getDirectionTo(unpackAsRoomPos(this.moveRequest, room.name))) !== OK)
        return false;
    room.moveRequests[this.moveRequest] = [];
    delete this.moveRequest;
    room.creepPositions[pack(this.pos)] = undefined;
    room.creepPositions[this.moveRequest] = this.name;
    this.moved = true;
    return true;
};
Creep.prototype.recurseMoveRequest = function (queue = []) {
    const { room } = this;
    if (!this.moveRequest)
        return;
    queue.push(this.name);
    const creepNameAtPos = room.creepPositions[this.moveRequest];
    if (!creepNameAtPos) {
        for (let index = 0; index < queue.length; index++)
            Game.creeps[queue[index]].runMoveRequest();
        return;
    }
    const creepAtPos = Game.creeps[creepNameAtPos];
    if (creepAtPos.moved)
        return;
    if (creepAtPos.fatigue > 0)
        return;
    if (creepAtPos.moveRequest && room.moveRequests[pack(creepAtPos.pos)]) {
        if (pack(this.pos) === creepAtPos.moveRequest) {
            this.runMoveRequest();
            creepAtPos.runMoveRequest();
            return;
        }
        if (queue.includes(creepAtPos.name)) {
            for (let index = 0; index < queue.length; index++)
                Game.creeps[queue[index]].runMoveRequest();
            return;
        }
        creepAtPos.recurseMoveRequest(queue);
        return;
    }
    if (creepAtPos.shove(this.pos)) {
        this.runMoveRequest();
        return;
    }
    this.runMoveRequest();
    creepAtPos.moveRequest = pack(this.pos);
    creepAtPos.runMoveRequest();
};
Creep.prototype.needsResources = function () {
    if (this.usedStore() === 0)
        return (this.memory.NR = true);
    if (this.freeStore(RESOURCE_ENERGY) <= 0) {
        delete this.memory.NR;
        return false;
    }
    return this.memory.NR;
};
Creep.prototype.isOnExit = function () {
    const { x } = this.pos;
    const { y } = this.pos;
    if (x <= 0 || x >= 49 || y <= 0 || y >= 49)
        return true;
    return false;
};
Creep.prototype.findTotalHealPower = function (range = 1) {
    let heal = 0;
    for (const part of this.body) {
        if (part.type !== HEAL)
            continue;
        heal +=
            (part.boost ? BOOSTS[part.type][part.boost][part.type] : 1) * (range <= 1 ? HEAL_POWER : RANGED_HEAL_POWER);
    }
    return heal;
};
Creep.prototype.advancedRecycle = function () {
    const { room } = this;
    if (!room.structures.spawn.length)
        return;
    this.say('♻️');
    let closestSpawn;
    if (this.memory.RecT) {
        closestSpawn = findObjectWithID(this.memory.RecT);
    }
    if (!closestSpawn)
        closestSpawn = this.pos.findClosestByPath(room.structures.spawn, {
            ignoreCreeps: true,
            ignoreRoads: this.memory.roads,
        });
    if (!closestSpawn)
        return;
    this.memory.RecT = closestSpawn.id;
    const fastFillerContainers = [room.fastFillerContainerLeft, room.fastFillerContainerRight].filter(function (container) {
        return container && getRange(container.pos.x, closestSpawn.pos.x, container.pos.y, closestSpawn.pos.y) == 1;
    });
    if (fastFillerContainers.length) {
        const closestContainer = findClosestObject(closestSpawn.pos, fastFillerContainers);
        if (getRange(this.pos.x, closestContainer.pos.x, this.pos.y, closestContainer.pos.y) > 0) {
            this.createMoveRequest({
                origin: this.pos,
                goal: { pos: closestContainer.pos, range: 0 },
                avoidEnemyRanges: true,
            });
            return;
        }
    }
    else if (this.pos.getRangeTo(closestSpawn.pos) > 1) {
        this.createMoveRequest({
            origin: this.pos,
            goal: { pos: closestSpawn.pos, range: 1 },
            avoidEnemyRanges: true,
        });
        return;
    }
    closestSpawn.recycleCreep(this);
};
Creep.prototype.advancedRenew = function () {
    const { room } = this;
    if (this.body.length > 8)
        return false;
    if (Game.cpu.bucket < CPUBucketRenewThreshold)
        return false;
    if (!room.myCreeps.fastFiller.length)
        return false;
    if (this.isDying())
        return false;
    if (CREEP_LIFE_TIME - this.ticksToLive < Math.ceil(this.findCost() / 2.5 / this.body.length))
        return false;
    const spawns = room.structures.spawn;
    if (!spawns.length)
        return false;
    const spawn = spawns.find(spawn => this.pos.getRangeTo(spawn.pos) === 1);
    if (!spawn)
        return false;
    if (spawn.hasRenewed)
        return false;
    if (spawn.spawning)
        return false;
    spawn.hasRenewed = true;
    return spawn.renewCreep(this) === OK;
};
Creep.prototype.advancedReserveController = function () {
    const { room } = this;
    const { controller } = room;
    if (this.pos.getRangeTo(controller.pos) === 1) {
        if (controller.reservation && controller.reservation.username !== Memory.me) {
            this.say('🗡️');
            return this.attackController(controller) === OK;
        }
        this.say('🤳');
        return this.reserveController(controller) === OK;
    }
    this.say('⏩🤳');
    this.createMoveRequest({
        origin: this.pos,
        goal: { pos: controller.pos, range: 1 },
        avoidEnemyRanges: true,
        plainCost: 1,
    });
    return true;
};
Creep.prototype.findCost = function () {
    let cost = 0;
    for (const part of this.body)
        cost += BODYPART_COST[part.type];
    return cost;
};
Creep.prototype.passiveHeal = function () {
    const { room } = this;
    this.say('PH');
    if (!this.meleed) {
        if (this.hitsMax > this.hits) {
            this.heal(this);
            return false;
        }
        let top = Math.max(Math.min(this.pos.y - 1, roomDimensions - 2), 2);
        let left = Math.max(Math.min(this.pos.x - 1, roomDimensions - 2), 2);
        let bottom = Math.max(Math.min(this.pos.y + 1, roomDimensions - 2), 2);
        let right = Math.max(Math.min(this.pos.x + 1, roomDimensions - 2), 2);
        const adjacentCreeps = room.lookForAtArea(LOOK_CREEPS, top, left, bottom, right, true);
        for (const posData of adjacentCreeps) {
            if (this.id === posData.creep.id)
                continue;
            if (!posData.creep.my && !Memory.allyList.includes(posData.creep.owner.username))
                continue;
            if (posData.creep.hitsMax === posData.creep.hits)
                continue;
            this.heal(posData.creep);
            return false;
        }
    }
    if (this.ranged)
        return false;
    let top = Math.max(Math.min(this.pos.y - 3, roomDimensions - 2), 2);
    let left = Math.max(Math.min(this.pos.x - 3, roomDimensions - 2), 2);
    let bottom = Math.max(Math.min(this.pos.y + 3, roomDimensions - 2), 2);
    let right = Math.max(Math.min(this.pos.x + 3, roomDimensions - 2), 2);
    const nearbyCreeps = room.lookForAtArea(LOOK_CREEPS, top, left, bottom, right, true);
    for (const posData of nearbyCreeps) {
        if (this.id === posData.creep.id)
            continue;
        if (!posData.creep.my && !Memory.allyList.includes(posData.creep.owner.username))
            continue;
        if (posData.creep.hitsMax === posData.creep.hits)
            continue;
        this.rangedHeal(posData.creep);
        return true;
    }
    return false;
};
Creep.prototype.aggressiveHeal = function () {
    const { room } = this;
    this.say('AH');
    if (this.meleed) {
        if (this.hitsMax > this.hits) {
            this.heal(this);
            return false;
        }
    }
    const healTargets = room
        .find(FIND_MY_CREEPS)
        .concat(room.allyCreeps)
        .filter(function (creep) {
        return creep.hitsMax > creep.hits;
    });
    if (!healTargets.length)
        return false;
    const healTarget = findClosestObject(this.pos, healTargets);
    const range = getRange(this.pos.x, healTarget.pos.x, this.pos.y, healTarget.pos.y);
    if (range > 1) {
        if (this.ranged)
            return false;
        this.createMoveRequest({
            origin: this.pos,
            goal: { pos: healTarget.pos, range: 1 },
        });
        if (range <= 3) {
            this.rangedHeal(healTarget);
            return true;
        }
    }
    if (this.meleed)
        return false;
    this.heal(healTarget);
    return true;
};
Creep.prototype.passiveRangedAttack = function () {
    return true;
};
Creep.prototype.deleteReservation = function (index) {
    this.memory.reservations.splice(index);
    this.message += '❌';
};
Creep.prototype.createReservation = function (type, targetID, amount, resourceType) {
    if (!this.memory.reservations)
        this.memory.reservations = [];
    this.memory.reservations.push({
        type,
        targetID,
        amount,
        resourceType,
    });
    const reservation = this.memory.reservations[0];
    const target = findObjectWithID(reservation.targetID);
    this.message += '➕' + type[0];
    if (target instanceof Resource) {
        target.reserveAmount -= reservation.amount;
        return;
    }
    if (reservation.type === 'transfer') {
        target.store[reservation.resourceType] += reservation.amount;
        return;
    }
    target.store[reservation.resourceType] -= reservation.amount;
};
Creep.prototype.reservationManager = function () {
    if (!this.memory.reservations)
        return;
    for (let index = 0; index < this.memory.reservations.length; index++) {
        const reservation = this.memory.reservations[index];
        const target = findObjectWithID(reservation.targetID);
        if (!target || target.room.name !== this.room.name) {
            this.deleteReservation(index);
            continue;
        }
        if (target instanceof Resource) {
            target.reserveAmount -= reservation.amount;
            continue;
        }
        if (reservation.type === 'transfer') {
            let amount = Math.min(reservation.amount, target.freeStore(reservation.resourceType));
            target.store[reservation.resourceType] += amount;
            if (amount === 0) {
                target.store[reservation.resourceType] -= amount;
                this.deleteReservation(0);
            }
            if (Memory.roomVisuals) {
                this.room.visual.text(`${amount}`, this.pos.x, this.pos.y + 1);
                this.room.visual.text(`${target.store[reservation.resourceType]}`, this.pos.x, this.pos.y + 2);
            }
            reservation.amount = amount;
            continue;
        }
        target.store[reservation.resourceType] -= reservation.amount;
    }
};
Creep.prototype.fulfillReservation = function () {
    if (!this.memory.reservations)
        return true;
    const reservation = this.memory.reservations[0];
    if (!reservation)
        return true;
    const target = findObjectWithID(reservation.targetID);
    const { room } = this;
    if (Memory.roomVisuals)
        room.visual.line(this.pos, target.pos, {
            color: myColors.lightBlue,
            width: 0.15,
        });
    this.message += '📲';
    if (getRange(this.pos.x, target.pos.x, this.pos.y, target.pos.y) > 1) {
        this.createMoveRequest({
            origin: this.pos,
            goal: { pos: target.pos, range: 1 },
            avoidEnemyRanges: true,
        });
        return false;
    }
    if (target instanceof Resource) {
        const pickupResult = this.pickup(target);
        this.message += pickupResult;
        if (pickupResult === ERR_FULL) {
            this.deleteReservation(0);
            return true;
        }
        if (pickupResult === OK) {
            target.reserveAmount -= reservation.amount;
            this.store[reservation.resourceType] += reservation.amount;
            this.deleteReservation(0);
            return true;
        }
        return false;
    }
    let amount = 0;
    if (reservation.type === 'transfer') {
        amount = Math.min(reservation.amount, target.freeStore(RESOURCE_ENERGY) + reservation.amount);
        target.store[reservation.resourceType] -= amount;
        this.message += amount;
        const transferResult = this.transfer(target, reservation.resourceType, amount);
        this.message += transferResult;
        if (transferResult === ERR_FULL || transferResult === ERR_NOT_ENOUGH_RESOURCES) {
            this.deleteReservation(0);
            return true;
        }
        if (transferResult === OK) {
            target.store[reservation.resourceType] += amount;
            this.store[reservation.resourceType] -= amount;
            this.deleteReservation(0);
            return true;
        }
        return false;
    }
    amount = Math.min(reservation.amount, target.store[reservation.resourceType] + reservation.amount);
    target.store[reservation.resourceType] += amount;
    const withdrawResult = this.withdraw(target, reservation.resourceType, amount);
    if (withdrawResult === ERR_FULL) {
        this.deleteReservation(0);
        return true;
    }
    if (withdrawResult === OK) {
        target.store[reservation.resourceType] -= amount;
        this.store[reservation.resourceType] += amount;
        this.deleteReservation(0);
        return true;
    }
    return false;
};
Creep.prototype.reserveWithdrawEnergy = function () {
    const { room } = this;
    if (!this.needsResources())
        return;
    let withdrawTargets = room.MAWT.filter(target => {
        if (target instanceof Resource)
            return (target.reserveAmount >= this.store.getCapacity(RESOURCE_ENERGY) * 0.2 ||
                target.reserveAmount >= this.freeStore(RESOURCE_ENERGY));
        return target.store.energy >= this.freeStore(RESOURCE_ENERGY);
    });
    withdrawTargets = withdrawTargets.concat([room.fastFillerContainerLeft, room.fastFillerContainerRight, room.controllerContainer].filter(target => {
        return target && target.store.energy >= target.store.getCapacity(RESOURCE_ENERGY) * 0.5;
    }));
    let target;
    let amount;
    if (withdrawTargets.length) {
        target = findClosestObject(this.pos, withdrawTargets);
        if (target instanceof Resource)
            amount = Math.min(this.freeStore(RESOURCE_ENERGY), target.reserveAmount);
        else
            amount = Math.min(this.freeStore(RESOURCE_ENERGY), target.store.energy);
        this.createReservation('withdraw', target.id, amount, RESOURCE_ENERGY);
        return;
    }
    withdrawTargets = room.OAWT.filter(target => {
        if (target instanceof Resource)
            return (target.reserveAmount >= this.store.getCapacity(RESOURCE_ENERGY) * 0.2 ||
                target.reserveAmount >= this.freeStore(RESOURCE_ENERGY));
        return target.store.energy >= this.freeStore(RESOURCE_ENERGY);
    });
    if (!withdrawTargets.length)
        return;
    target = findClosestObject(this.pos, withdrawTargets);
    if (target instanceof Resource)
        amount = Math.min(this.freeStore(RESOURCE_ENERGY), target.reserveAmount);
    else
        amount = Math.min(this.freeStore(RESOURCE_ENERGY), target.store.energy);
    this.createReservation('withdraw', target.id, amount, RESOURCE_ENERGY);
};
Creep.prototype.reserveTransferEnergy = function () {
    const { room } = this;
    if (this.usedStore() === 0)
        return;
    let transferTargets = room.MATT.filter(function (target) {
        return target.freeSpecificStore(RESOURCE_ENERGY) > 0;
    });
    transferTargets = transferTargets.concat(room.MEFTT.filter(target => {
        return ((target.freeStore(RESOURCE_ENERGY) >= this.store.energy && this.store.energy > 0) ||
            target.freeSpecificStore(RESOURCE_ENERGY) >= this.store.energy + this.freeStore(RESOURCE_ENERGY));
    }));
    let target;
    let amount;
    if (transferTargets.length) {
        target = findClosestObject(this.pos, transferTargets);
        amount = Math.min(Math.max(this.usedStore(), 0), target.freeSpecificStore(RESOURCE_ENERGY));
        this.createReservation('transfer', target.id, amount, RESOURCE_ENERGY);
        return;
    }
    transferTargets = room.OATT.filter(target => {
        return target.freeStore(RESOURCE_ENERGY) >= this.usedStore();
    });
    if (!transferTargets.length)
        return;
    target = findClosestObject(this.pos, transferTargets);
    amount = Math.min(Math.max(this.usedStore(), 0), target.freeStore(RESOURCE_ENERGY));
    this.createReservation('transfer', target.id, amount, RESOURCE_ENERGY);
};

function controllerUpgraderManager(room, creepsOfRole) {
    for (const creepName of creepsOfRole) {
        const creep = Game.creeps[creepName];
        creep.advancedUpgradeController();
    }
}
ControllerUpgrader.prototype.isDying = function () {
    if (this.memory.dying)
        return true;
    if (!this.ticksToLive)
        return false;
    if (this.ticksToLive > this.body.length * CREEP_SPAWN_TIME + (this.room.upgradePathLength - 3))
        return false;
    this.memory.dying = true;
    return true;
};

function mineralHarvesterManager(room, creepsOfRole) {
    for (const creepName of creepsOfRole) {
        const creep = Game.creeps[creepName];
        const mineral = room.mineral;
        if (mineral.mineralAmount === 0) {
            creep.advancedRecycle();
            continue;
        }
        if (creep.needsResources()) {
            creep.advancedHarvestMineral(mineral);
            continue;
        }
        if (room.terminal && room.terminal.store.getFreeCapacity() >= 10000) {
            creep.advancedTransfer(room.terminal, mineral.mineralType);
        }
    }
}
MineralHarvester.prototype.advancedHarvestMineral = function (mineral) {
    const creep = this;
    const { room } = creep;
    if (!creep.findMineralHarvestPos())
        return false;
    creep.say('🚬');
    const harvestPos = unpackAsRoomPos(creep.memory.packedPos, room.name);
    if (getRange(creep.pos.x, harvestPos.x, creep.pos.y, harvestPos.y) > 0) {
        creep.say('⏩M');
        creep.createMoveRequest({
            origin: creep.pos,
            goal: { pos: harvestPos, range: 0 },
            avoidEnemyRanges: true,
        });
        return false;
    }
    if (creep.harvest(mineral) !== OK)
        return false;
    const mineralsHarvested = Math.min(this.parts.work * HARVEST_POWER, mineral.mineralAmount);
    if (global.roomStats[this.room.name])
        global.roomStats[this.room.name].mh += mineralsHarvested;
    creep.say(`⛏️${mineralsHarvested}`);
    return true;
};

function maintainerManager(room, creepsOfRole) {
    for (const creepName of creepsOfRole) {
        const creep = Game.creeps[creepName];
        if (creep.advancedMaintain())
            continue;
        if (creep.maintainNearby())
            continue;
    }
}
Maintainer.prototype.advancedMaintain = function () {
    const { room } = this;
    this.say('⏩🔧');
    if (this.needsResources()) {
        if (!this.memory.reservations || !this.memory.reservations.length)
            this.reserveWithdrawEnergy();
        if (!this.fulfillReservation()) {
            this.say(this.message);
            return false;
        }
        this.reserveWithdrawEnergy();
        if (!this.fulfillReservation()) {
            this.say(this.message);
            return false;
        }
        if (this.needsResources())
            return false;
    }
    const workPartCount = this.parts.work;
    const repairTarget = findObjectWithID(this.memory.repairTarget) ||
        this.findRepairTarget() ||
        this.findRampartRepairTarget(workPartCount);
    if (!repairTarget)
        return false;
    this.memory.repairTarget = repairTarget.id;
    if (Memory.roomVisuals)
        room.visual.text(repairTarget.structureType === STRUCTURE_RAMPART ? '🧱' : '🔧', repairTarget.pos);
    if (this.pos.getRangeTo(repairTarget.pos) > 3) {
        this.createMoveRequest({
            origin: this.pos,
            goal: { pos: repairTarget.pos, range: 3 },
            avoidEnemyRanges: true,
        });
        return false;
    }
    const repairResult = this.repair(repairTarget);
    if (repairResult !== OK)
        return false;
    const energySpentOnRepairs = Math.min(workPartCount, (repairTarget.hitsMax - repairTarget.hits) / REPAIR_POWER);
    if (repairTarget.structureType === STRUCTURE_RAMPART) {
        if (global.roomStats[this.room.name])
            global.roomStats[this.room.name].eorwr += energySpentOnRepairs;
        this.say(`🧱${energySpentOnRepairs * REPAIR_POWER}`);
    }
    else {
        if (global.roomStats[this.room.name])
            global.roomStats[this.room.name].eoro += energySpentOnRepairs;
        this.say(`🔧${energySpentOnRepairs * REPAIR_POWER}`);
    }
    repairTarget.realHits = repairTarget.hits + workPartCount * REPAIR_POWER;
    if (repairTarget.structureType === STRUCTURE_RAMPART) {
        if (repairTarget.realHits <= this.memory.quota + workPartCount * REPAIR_POWER * 25)
            return true;
    }
    else if (repairTarget.hitsMax - repairTarget.realHits >= workPartCount * REPAIR_POWER)
        return true;
    delete this.memory.repairTarget;
    const newRepairTarget = this.findRepairTarget(new Set([repairTarget.id]));
    if (!newRepairTarget)
        return true;
    this.createMoveRequest({
        origin: this.pos,
        goal: { pos: newRepairTarget.pos, range: 3 },
        avoidEnemyRanges: true,
    });
    return true;
};
Maintainer.prototype.maintainNearby = function () {
    const { room } = this;
    if (this.store.getUsedCapacity(RESOURCE_ENERGY) === 0)
        return false;
    const structuresAsPos = this.pos.lookFor(LOOK_STRUCTURES);
    const workPartCount = this.parts.work;
    let structure;
    for (structure of structuresAsPos) {
        if (structure.structureType !== STRUCTURE_ROAD && structure.structureType !== STRUCTURE_CONTAINER)
            continue;
        if (structure.hitsMax - structure.hits < workPartCount * REPAIR_POWER)
            break;
        if (this.repair(structure) !== OK)
            return false;
        const energySpentOnRepairs = Math.min(workPartCount, (structure.hitsMax - structure.hits) / REPAIR_POWER);
        this.say(`👣🔧${energySpentOnRepairs * REPAIR_POWER}`);
        return true;
    }
    const adjacentStructures = room.lookForAtArea(LOOK_STRUCTURES, Math.max(Math.min(this.pos.y - 3, -1), 1), Math.max(Math.min(this.pos.x - 3, -1), 1), Math.max(Math.min(this.pos.y + 3, -1), 1), Math.max(Math.min(this.pos.x + 3, -1), 1), true);
    for (const adjacentPosData of adjacentStructures) {
        structure = adjacentPosData.structure;
        if (structure.structureType !== STRUCTURE_ROAD && structure.structureType !== STRUCTURE_CONTAINER)
            continue;
        if (structure.hitsMax - structure.hits < workPartCount * REPAIR_POWER)
            continue;
        if (this.repair(structure) !== OK)
            return false;
        const energySpentOnRepairs = Math.min(workPartCount, (structure.hitsMax - structure.hits) / REPAIR_POWER);
        this.say(`🗺️🔧${energySpentOnRepairs * REPAIR_POWER}`);
        return true;
    }
    return false;
};

function builderManager(room, creepsOfRole) {
    const cSiteTarget = room.cSiteTarget;
    for (const creepName of creepsOfRole) {
        const creep = Game.creeps[creepName];
        if (!cSiteTarget) {
            creep.advancedRecycle();
            continue;
        }
        if (creep.needsResources()) {
            if (!(room.myCreeps.source1Harvester.length + room.myCreeps.source2Harvester.length)) {
                const sources = room.find(FIND_SOURCES_ACTIVE);
                if (!sources.length)
                    continue;
                const source = creep.pos.findClosestByPath(sources, {
                    ignoreCreeps: true,
                });
                if (getRange(creep.pos.x, source.pos.x, creep.pos.y, source.pos.y) > 1) {
                    creep.createMoveRequest({
                        origin: creep.pos,
                        goal: { pos: source.pos, range: 1 },
                        avoidEnemyRanges: true,
                    });
                    continue;
                }
                creep.advancedHarvestSource(source);
                continue;
            }
            if (room.fastFillerContainerLeft || room.fastFillerContainerRight) {
                if (!creep.memory.reservations || !creep.memory.reservations.length)
                    creep.reserveWithdrawEnergy();
                if (!creep.fulfillReservation()) {
                    creep.say(creep.message);
                    continue;
                }
                creep.reserveWithdrawEnergy();
                if (!creep.fulfillReservation()) {
                    creep.say(creep.message);
                    continue;
                }
                if (creep.needsResources())
                    continue;
            }
            else if (creep.store.energy < creep.parts.work * BUILD_POWER)
                continue;
        }
        if (creep.advancedBuildCSite())
            continue;
    }
}

function scoutManager(room, creepsOfRole) {
    for (const creepName of creepsOfRole) {
        const creep = Game.creeps[creepName];
        const commune = Game.rooms[creep.commune];
        if (!commune)
            continue;
        if (creep.memory.scoutTarget === room.name) {
            creep.say('👁️');
            room.findType(commune);
            room.cleanMemory();
            delete creep.memory.scoutTarget;
        }
        if (!creep.findScoutTarget())
            return;
        creep.say(`🔭${creep.memory.scoutTarget.toString()}`);
        if (!creep.advancedSignController())
            continue;
        creep.memory.signTarget = creep.memory.scoutTarget;
        creep.createMoveRequest({
            origin: creep.pos,
            goal: {
                pos: new RoomPosition(25, 25, creep.memory.scoutTarget),
                range: 25,
            },
            avoidEnemyRanges: true,
            plainCost: 1,
            swampCost: 1,
        });
    }
}
Scout.prototype.findScoutTarget = function () {
    if (this.memory.scoutTarget)
        return true;
    const commune = Game.rooms[this.commune];
    const scoutedRooms = [];
    const unscoutedRooms = [];
    const exits = Game.map.describeExits(this.room.name);
    for (const exitType in exits) {
        const roomName = exits[exitType];
        if (Game.map.getRoomStatus(roomName).status !== Game.map.getRoomStatus(this.room.name).status)
            continue;
        if (commune.scoutTargets.has(roomName))
            continue;
        if (Memory.rooms[roomName] && Memory.rooms[roomName].lastScout) {
            scoutedRooms.push(roomName);
            continue;
        }
        unscoutedRooms.push(roomName);
    }
    const scoutTarget = unscoutedRooms.length
        ? unscoutedRooms.sort((a, b) => Game.map.getRoomLinearDistance(this.commune, a) - Game.map.getRoomLinearDistance(this.commune, b))[0]
        : scoutedRooms.sort((a, b) => Memory.rooms[a].lastScout - Memory.rooms[b].lastScout)[0];
    if (!scoutTarget)
        return false;
    this.memory.scoutTarget = scoutTarget;
    commune.scoutTargets.add(scoutTarget);
    return true;
};
Scout.prototype.recordDeposits = function () {
    const { room } = this;
    if (room.memory.type != 'highway')
        return;
    if (room.memory.commune) {
        if (!Memory.communes.includes(room.memory.commune)) {
            room.memory.commune = findClosestCommuneName(room.name);
        }
    }
    else {
        room.memory.commune = findClosestCommuneName(room.name);
    }
    const communeMemory = Memory.rooms[room.memory.commune];
    const deposits = room.find(FIND_DEPOSITS);
    const unAssignedDeposits = deposits.filter(function (deposit) {
        return !communeMemory.deposits[deposit.id] && deposit.lastCooldown <= 100 && deposit.ticksToDecay > 500;
    });
    for (const deposit of unAssignedDeposits)
        communeMemory.deposits[deposit.id] = {
            decay: deposit.ticksToDecay,
            needs: [1, 1],
        };
};
Scout.prototype.advancedSignController = function () {
    const { room } = this;
    const { controller } = room;
    if (!controller)
        return true;
    if (room.name !== this.memory.signTarget)
        return true;
    let signMessage;
    if (room.memory.type === 'ally' || room.memory.type === 'enemy')
        return true;
    if (controller.reservation && controller.reservation.username != Memory.me)
        return true;
    if (room.memory.type === 'commune') {
        if (controller.sign && communeSigns.includes(controller.sign.text))
            return true;
        signMessage = communeSigns[0];
    }
    else {
        if (controller.sign && nonCommuneSigns.includes(controller.sign.text))
            return true;
        signMessage = nonCommuneSigns[Math.floor(Math.random() * nonCommuneSigns.length)];
    }
    if (getRange(this.pos.x, controller.pos.x, this.pos.y, controller.pos.y) > 1) {
        this.createMoveRequest({
            origin: this.pos,
            goal: { pos: room.controller.pos, range: 1 },
            avoidEnemyRanges: true,
            plainCost: 1,
            swampCost: 1,
        });
        this.say(this.moveRequest.toString());
        if (!this.moveRequest)
            return true;
        return false;
    }
    this.signController(room.controller, signMessage);
    return true;
};

function haulerManager(room, creepsOfRole) {
    for (const creepName of creepsOfRole) {
        const creep = Game.creeps[creepName];
        creep.advancedRenew();
        if (!creep.memory.reservations || !creep.memory.reservations.length)
            creep.reserve();
        if (!creep.fulfillReservation()) {
            creep.say(creep.message);
            continue;
        }
        creep.reserve();
        if (!creep.fulfillReservation()) {
            creep.say(creep.message);
            continue;
        }
        if (creep.message.length)
            creep.say(creep.message);
    }
}
Hauler.prototype.reserve = function () {
    const { room } = this;
    let withdrawTargets = room.MAWT.filter(target => {
        if (target instanceof Resource)
            return (target.reserveAmount >= this.store.getCapacity(RESOURCE_ENERGY) * 0.2 ||
                target.reserveAmount >= this.freeStore(RESOURCE_ENERGY));
        return target.store.energy >= this.freeStore(RESOURCE_ENERGY);
    });
    let transferTargets;
    let target;
    let amount;
    if (this.needsResources()) {
        if (withdrawTargets.length) {
            target = findClosestObject(this.pos, withdrawTargets);
            if (target instanceof Resource)
                amount = Math.min(this.freeStore(RESOURCE_ENERGY), target.reserveAmount);
            else
                amount = Math.min(this.freeStore(RESOURCE_ENERGY), target.store.energy);
            this.createReservation('withdraw', target.id, amount, RESOURCE_ENERGY);
            return;
        }
        transferTargets = room.MATT.filter(function (target) {
            return target.freeStore(RESOURCE_ENERGY) > 0;
        });
        transferTargets = transferTargets.concat(room.MEFTT.filter(target => {
            return ((target.freeStore(RESOURCE_ENERGY) >= this.store.energy && this.store.energy > 0) ||
                target.freeSpecificStore(RESOURCE_ENERGY) >= this.store.energy + this.freeStore(RESOURCE_ENERGY));
        }));
        if (transferTargets.length) {
            withdrawTargets = room.OAWT.filter(target => {
                if (target instanceof Resource)
                    return (target.reserveAmount >= this.store.getCapacity(RESOURCE_ENERGY) * 0.2 ||
                        target.reserveAmount >= this.freeStore(RESOURCE_ENERGY));
                return target.store.energy >= this.freeStore(RESOURCE_ENERGY);
            });
            if (!withdrawTargets.length)
                return;
            target = findClosestObject(this.pos, withdrawTargets);
            if (target instanceof Resource)
                amount = Math.min(this.freeStore(RESOURCE_ENERGY), target.reserveAmount);
            else
                amount = Math.min(this.freeStore(RESOURCE_ENERGY), target.store.energy);
            this.createReservation('withdraw', target.id, amount, RESOURCE_ENERGY);
            return;
        }
        return;
    }
    if (!transferTargets) {
        transferTargets = room.MATT.filter(function (target) {
            return target.freeSpecificStore(RESOURCE_ENERGY) > 0;
        });
        transferTargets = transferTargets.concat(room.MEFTT.filter(target => {
            return ((target.freeStore(RESOURCE_ENERGY) >= this.store.energy && this.store.energy > 0) ||
                target.freeSpecificStore(RESOURCE_ENERGY) >= this.store.energy + this.freeStore(RESOURCE_ENERGY));
        }));
    }
    if (transferTargets.length) {
        target = transferTargets.sort((a, b) => {
            return (getRange(this.pos.x, a.pos.x, this.pos.y, a.pos.y) +
                a.store.energy * 0.05 -
                (getRange(this.pos.x, b.pos.x, this.pos.y, b.pos.y) + b.store.energy * 0.05));
        })[0];
        amount = Math.min(Math.max(this.store.energy, 0), target.freeSpecificStore(RESOURCE_ENERGY));
        this.createReservation('transfer', target.id, amount, RESOURCE_ENERGY);
        return;
    }
    transferTargets = room.OATT.filter(target => {
        return target.freeStore(RESOURCE_ENERGY) >= this.store.energy;
    });
    if (!transferTargets.length)
        return;
    target = findClosestObject(this.pos, transferTargets);
    amount = Math.min(Math.max(this.store.energy, 0), target.freeStore(RESOURCE_ENERGY));
    this.createReservation('transfer', target.id, amount, RESOURCE_ENERGY);
    return;
};

RemoteHarvester.prototype.findRemote = function () {
    var _a;
    const creep = this;
    if (creep.memory.remote)
        return true;
    const role = creep.role;
    const remoteNamesByEfficacy = (_a = Game.rooms[creep.commune]) === null || _a === void 0 ? void 0 : _a.get('remoteNamesByEfficacy');
    for (const roomName of remoteNamesByEfficacy) {
        const roomMemory = Memory.rooms[roomName];
        if (roomMemory.needs[remoteNeedsIndex[role]] <= 0)
            continue;
        creep.memory.remote = roomName;
        roomMemory.needs[remoteNeedsIndex[role]] -= this.parts.work;
        return true;
    }
    return false;
};
RemoteHarvester.prototype.travelToSource = function (sourceIndex) {
    const creep = this;
    const { room } = creep;
    if (!creep.findSourcePos(sourceIndex))
        return false;
    creep.say('🚬');
    const harvestPos = unpackAsPos(creep.memory.packedPos);
    if (getRange(creep.pos.x, harvestPos.x, creep.pos.y, harvestPos.y) === 0)
        return false;
    creep.say(`⏩ ${sourceIndex}`);
    creep.createMoveRequest({
        origin: creep.pos,
        goal: {
            pos: new RoomPosition(harvestPos.x, harvestPos.y, room.name),
            range: 0,
        },
        avoidEnemyRanges: true,
    });
    return true;
};

function source2RemoteHarvesterManager(room, creepsOfRole) {
    for (const creepName of creepsOfRole) {
        const creep = Game.creeps[creepName];
        if (!creep.findRemote())
            continue;
        creep.say(creep.memory.remote);
        if (room.name === creep.memory.remote) {
            const sourceIndex = 1;
            if (creep.travelToSource(sourceIndex))
                continue;
            if (creep.advancedHarvestSource(room.sources[sourceIndex]))
                continue;
            continue;
        }
        creep.createMoveRequest({
            origin: creep.pos,
            goal: {
                pos: new RoomPosition(25, 25, creep.memory.remote),
                range: 25,
            },
            avoidEnemyRanges: true,
        });
    }
}

function remoteHaulerManager(room, creepsOfRole) {
    for (const creepName of creepsOfRole) {
        const creep = Game.creeps[creepName];
        if (creep.needsResources()) {
            if (!creep.findRemote())
                continue;
            if (room.name === creep.memory.remote) {
                if (!creep.memory.reservations || !creep.memory.reservations.length)
                    creep.reserveWithdrawEnergy();
                if (!creep.fulfillReservation()) {
                    creep.say(creep.message);
                    continue;
                }
                creep.reserveWithdrawEnergy();
                if (!creep.fulfillReservation()) {
                    creep.say(creep.message);
                    continue;
                }
                if (creep.needsResources())
                    continue;
                creep.message += creep.commune;
                creep.say(creep.message);
                creep.createMoveRequest({
                    origin: creep.pos,
                    goal: {
                        pos: new RoomPosition(25, 25, creep.commune),
                        range: 20,
                    },
                    avoidEnemyRanges: true,
                });
                continue;
            }
            creep.message += creep.memory.remote;
            creep.say(creep.message);
            creep.createMoveRequest({
                origin: creep.pos,
                goal: {
                    pos: new RoomPosition(25, 25, creep.memory.remote),
                    range: 20,
                },
                avoidEnemyRanges: true,
            });
            continue;
        }
        if (room.name === creep.commune) {
            creep.advancedRenew();
            if (creep.memory.remote) {
                Memory.rooms[creep.memory.remote].needs[remoteNeedsIndex.remoteHauler] += creep.parts.carry;
                delete creep.memory.remote;
            }
            if (!creep.memory.reservations || !creep.memory.reservations.length)
                creep.reserveTransferEnergy();
            if (!creep.fulfillReservation()) {
                creep.say(creep.message);
                continue;
            }
            creep.reserveTransferEnergy();
            if (!creep.fulfillReservation()) {
                creep.say(creep.message);
                continue;
            }
            if (!creep.needsResources())
                continue;
            if (!creep.findRemote())
                continue;
            creep.message += creep.memory.remote;
            creep.say(creep.message);
            creep.createMoveRequest({
                origin: creep.pos,
                goal: {
                    pos: new RoomPosition(25, 25, creep.memory.remote),
                    range: 20,
                },
                avoidEnemyRanges: true,
            });
            continue;
        }
        creep.message += creep.commune;
        creep.say(creep.message);
        creep.createMoveRequest({
            origin: creep.pos,
            goal: {
                pos: new RoomPosition(25, 25, creep.commune),
                range: 20,
            },
            avoidEnemyRanges: true,
        });
    }
}
RemoteHauler.prototype.findRemote = function () {
    var _a;
    if (this.memory.remote)
        return true;
    const remoteNamesByEfficacy = (_a = Game.rooms[this.commune]) === null || _a === void 0 ? void 0 : _a.get('remoteNamesByEfficacy');
    let roomMemory;
    for (const roomName of remoteNamesByEfficacy) {
        roomMemory = Memory.rooms[roomName];
        if (roomMemory.needs[remoteNeedsIndex.remoteHauler] <= 0)
            continue;
        this.memory.remote = roomName;
        roomMemory.needs[remoteNeedsIndex.remoteHauler] -= this.parts.carry;
        return true;
    }
    return false;
};

function claimerManager(room, creepsOfRole) {
    for (const creepName of creepsOfRole) {
        const creep = Game.creeps[creepName];
        const claimTarget = Memory.rooms[creep.commune].claimRequest;
        if (!claimTarget)
            return;
        creep.say(claimTarget);
        Memory.claimRequests[Memory.rooms[creep.commune].claimRequest].needs[claimRequestNeedsIndex.claimer] = 0;
        if (room.name === claimTarget) {
            creep.claimRoom();
            continue;
        }
        creep.createMoveRequest({
            origin: creep.pos,
            goal: { pos: new RoomPosition(25, 25, claimTarget), range: 25 },
            avoidEnemyRanges: true,
            swampCost: 1,
            typeWeights: {
                enemy: Infinity,
                ally: Infinity,
                keeper: Infinity,
            },
        });
    }
}
Claimer.prototype.claimRoom = function () {
    const creep = this;
    const { room } = creep;
    if (room.controller.my)
        return;
    if (creep.pos.getRangeTo(room.controller) > 1) {
        creep.createMoveRequest({
            origin: creep.pos,
            goal: { pos: room.controller.pos, range: 1 },
            avoidEnemyRanges: true,
            plainCost: 1,
            swampCost: 1,
            typeWeights: {
                keeper: Infinity,
            },
        });
        return;
    }
    if (room.controller.owner || (room.controller.reservation && room.controller.reservation.username !== Memory.me)) {
        creep.attackController(room.controller);
        return;
    }
    creep.claimController(room.controller);
};

function meleeDefenderManager(room, creepsOfRole) {
    for (const creepName of creepsOfRole) {
        const creep = Game.creeps[creepName];
        creep.advancedDefend();
    }
}
MeleeDefender.prototype.advancedDefend = function () {
    const { room } = this;
    const enemyAttackers = room.enemyAttackers.filter(function (enemyAttacker) {
        return !enemyAttacker.isOnExit();
    });
    if (!enemyAttackers.length)
        return false;
    const enemyAttacker = this.pos.findClosestByPath(enemyAttackers, {
        ignoreCreeps: true,
    });
    const ramparts = room.structures.rampart.filter(rampart => {
        const structuresAtPos = room.lookForAt(LOOK_STRUCTURES, rampart.pos);
        for (const structure of structuresAtPos) {
            if (impassibleStructureTypes.includes(structure.structureType))
                return false;
        }
        if (rampart.pos === this.pos)
            return true;
        return room.creepPositions[pack(rampart.pos)];
    });
    if (!ramparts.length) {
        if (getRange(this.pos.x, enemyAttacker.pos.x, this.pos.y, enemyAttacker.pos.y) > 1) {
            this.createMoveRequest({
                origin: this.pos,
                goal: { pos: enemyAttacker.pos, range: 1 },
            });
            return true;
        }
        this.attack(enemyAttacker);
        if (enemyAttacker.getActiveBodyparts(MOVE) > 0)
            this.move(this.pos.getDirectionTo(enemyAttacker));
        return true;
    }
    this.attack(enemyAttacker);
    const closestRampart = enemyAttacker.pos.findClosestByPath(ramparts, {
        ignoreCreeps: true,
        ignoreRoads: true
    });
    if (Memory.roomVisuals)
        room.visual.line(this.pos, closestRampart.pos, {
            color: myColors.lightBlue,
        });
    if (this.pos.getRangeTo(closestRampart.pos) === 0)
        return false;
    this.createMoveRequest({
        origin: this.pos,
        goal: { pos: closestRampart.pos, range: 0 },
        plainCost: 20,
        swampCost: 80,
    });
    return true;
};

HubHauler.prototype.travelToHub = function () {
    const creep = this;
    const { room } = creep;
    const hubAnchor = unpackAsRoomPos(room.memory.stampAnchors.hub[0], room.name);
    if (!hubAnchor)
        return true;
    if (creep.pos.getRangeTo(hubAnchor) === 0)
        return false;
    creep.say('⏩H');
    creep.createMoveRequest({
        origin: creep.pos,
        goal: { pos: hubAnchor, range: 0 },
    });
    return true;
};
HubHauler.prototype.balanceStoringStructures = function () {
    const creep = this;
    const { room } = creep;
    const { storage } = room;
    const { terminal } = room;
    if (!storage || !terminal)
        return false;
    creep.say('BSS');
    if (creep.memory.taskTarget) {
        if (creep.memory.taskTarget !== storage.id && creep.memory.taskTarget !== terminal.id)
            return false;
        if (creep.advancedTransfer(findObjectWithID(creep.memory.taskTarget), RESOURCE_ENERGY))
            delete creep.memory.taskTarget;
        return true;
    }
    if (terminal.store.getUsedCapacity(RESOURCE_ENERGY) >
        storage.store.getUsedCapacity(RESOURCE_ENERGY) * 0.3 + creep.store.getCapacity() &&
        storage.store.getFreeCapacity() > creep.store.getCapacity()) {
        creep.withdraw(terminal, RESOURCE_ENERGY);
        creep.memory.taskTarget = storage.id;
        return true;
    }
    if (storage.store.getUsedCapacity(RESOURCE_ENERGY) * 0.3 >
        terminal.store.getUsedCapacity(RESOURCE_ENERGY) + creep.store.getCapacity() &&
        terminal.store.getFreeCapacity() > creep.store.getCapacity()) {
        creep.withdraw(storage, RESOURCE_ENERGY);
        creep.memory.taskTarget = terminal.id;
        return true;
    }
    return false;
};
HubHauler.prototype.fillHubLink = function () {
    const creep = this;
    const { room } = creep;
    const { storage } = room;
    const hubLink = room.hubLink;
    if (!storage || !hubLink)
        return false;
    creep.say('FHL');
    if (creep.memory.taskTarget) {
        if (creep.memory.taskTarget !== storage.id && creep.memory.taskTarget !== hubLink.id)
            return false;
        if (creep.advancedTransfer(findObjectWithID(creep.memory.taskTarget), RESOURCE_ENERGY))
            delete creep.memory.taskTarget;
        return true;
    }
    const fastFillerLink = room.fastFillerLink;
    if ((room.controller.ticksToDowngrade < 10000 ||
        (fastFillerLink &&
            fastFillerLink.store.getUsedCapacity(RESOURCE_ENERGY) <
                fastFillerLink.store.getCapacity(RESOURCE_ENERGY) * 0.25) ||
        storage.store.getUsedCapacity(RESOURCE_ENERGY) > creep.store.getCapacity(RESOURCE_ENERGY)) &&
        hubLink.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
        creep.withdraw(storage, RESOURCE_ENERGY);
        creep.memory.taskTarget = hubLink.id;
        return true;
    }
    return false;
};

function hubHaulerManager(room, creepsOfRole) {
    for (const creepName of creepsOfRole) {
        const creep = Game.creeps[creepName];
        if (creep.travelToHub())
            continue;
        if (creep.balanceStoringStructures())
            continue;
        if (creep.fillHubLink())
            continue;
        creep.say('🚬');
    }
}

function fastFillerManager(room, creepsOfRole) {
    for (const creepName of creepsOfRole) {
        const creep = Game.creeps[creepName];
        if (creep.travelToFastFiller())
            continue;
        if (creep.fillFastFiller())
            continue;
        if (creep.advancedRenew())
            continue;
    }
}
FastFiller.prototype.travelToFastFiller = function () {
    const { room } = this;
    if (!this.findFastFillerPos())
        return true;
    const fastFillerPos = unpackAsRoomPos(this.memory.packedPos, room.name);
    if (getRange(this.pos.x, fastFillerPos.x, this.pos.y, fastFillerPos.y) === 0)
        return false;
    this.say('⏩F');
    this.createMoveRequest({
        origin: this.pos,
        goal: { pos: fastFillerPos, range: 0 },
    });
    return true;
};
FastFiller.prototype.fillFastFiller = function () {
    const { room } = this;
    this.say('💁');
    if (this.usedStore() > this.store.energy) {
        for (const resourceType in this.store) {
            if (resourceType == RESOURCE_ENERGY)
                continue;
            this.say('WR');
            this.drop(resourceType);
            return true;
        }
    }
    const fastFillerContainers = [
        room.fastFillerContainerLeft,
        room.fastFillerContainerRight,
    ];
    if (room.energyAvailable === room.energyCapacityAvailable)
        return false;
    if (this.needsResources()) {
        const fastFillerStoringStructures = [
            room.fastFillerLink,
            ...fastFillerContainers
        ];
        let structures = fastFillerStoringStructures.length;
        for (const structure of fastFillerStoringStructures) {
            if (!structure) {
                structures -= 1;
                continue;
            }
            if (getRange(this.pos.x, structure.pos.x, this.pos.y, structure.pos.y) > 1)
                continue;
            if (structure.structureType != STRUCTURE_LINK &&
                this.usedStore() > structure.store.energy) {
                for (const resourceType in structure.store) {
                    if (resourceType == RESOURCE_ENERGY)
                        continue;
                    this.say('WCR');
                    this.withdraw(structure, resourceType);
                    return true;
                }
            }
            if (structure.store.energy < this.freeSpecificStore(RESOURCE_ENERGY) || structure.store.getUsedCapacity(RESOURCE_ENERGY) < this.freeSpecificStore(RESOURCE_ENERGY))
                continue;
            this.say('W');
            this.withdraw(structure, RESOURCE_ENERGY);
            structure.store.energy -= this.store.getCapacity() - this.store.energy;
            return true;
        }
        if (structures === 0) {
            this.suicide();
            return false;
        }
        return false;
    }
    const adjacentStructures = room.lookForAtArea(LOOK_STRUCTURES, this.pos.y - 1, this.pos.x - 1, this.pos.y + 1, this.pos.x + 1, true);
    for (const adjacentPosData of adjacentStructures) {
        const structure = adjacentPosData.structure;
        if (!structure.store)
            continue;
        if (structure.structureType !== STRUCTURE_SPAWN && structure.structureType !== STRUCTURE_EXTENSION)
            continue;
        if (structure.store.energy >= structure.store.getCapacity(RESOURCE_ENERGY))
            continue;
        this.say('T');
        this.transfer(structure, RESOURCE_ENERGY).toString();
        structure.store.energy += this.store.energy;
        return true;
    }
    return false;
};

function source1RemoteHarvesterManager(room, creepsOfRole) {
    for (const creepName of creepsOfRole) {
        const creep = Game.creeps[creepName];
        if (!creep.findRemote())
            continue;
        creep.say(creep.memory.remote);
        if (room.name === creep.memory.remote) {
            const sourceIndex = 0;
            if (creep.travelToSource(sourceIndex))
                continue;
            if (creep.advancedHarvestSource(room.sources[sourceIndex]))
                continue;
            continue;
        }
        creep.createMoveRequest({
            origin: creep.pos,
            goal: {
                pos: new RoomPosition(25, 25, creep.memory.remote),
                range: 25,
            },
            avoidEnemyRanges: true,
        });
    }
}

function remoteReserverManager(room, creepsOfRole) {
    for (const creepName of creepsOfRole) {
        const creep = Game.creeps[creepName];
        if (!creep.findRemote())
            continue;
        creep.say(creep.memory.remote);
        if (room.name === creep.memory.remote) {
            creep.advancedReserveController();
            continue;
        }
        creep.createMoveRequest({
            origin: creep.pos,
            goal: {
                pos: new RoomPosition(25, 25, creep.memory.remote),
                range: 25,
            },
            avoidEnemyRanges: true,
            plainCost: 1,
        });
        continue;
    }
}
RemoteReserver.prototype.findRemote = function () {
    var _a;
    if (this.memory.remote)
        return true;
    const remoteNamesByEfficacy = (_a = Game.rooms[this.commune]) === null || _a === void 0 ? void 0 : _a.get('remoteNamesByEfficacy');
    let roomMemory;
    for (const roomName of remoteNamesByEfficacy) {
        roomMemory = Memory.rooms[roomName];
        if (roomMemory.needs[remoteNeedsIndex.remoteReserver] <= 0)
            continue;
        this.memory.remote = roomName;
        roomMemory.needs[remoteNeedsIndex.remoteReserver] -= 1;
        return true;
    }
    return false;
};
RemoteReserver.prototype.isDying = function () {
    if (this.memory.dying)
        return true;
    if (!this.ticksToLive)
        return false;
    if (this.ticksToLive > this.body.length * CREEP_CLAIM_LIFE_TIME)
        return false;
    this.memory.dying = true;
    return true;
};

function remoteDefenderManager(room, creepsOfRole) {
    for (const creepName of creepsOfRole) {
        const creep = Game.creeps[creepName];
        if (!creep.findRemote()) {
            if (room.name === creep.commune) {
                creep.advancedRecycle();
                continue;
            }
            creep.createMoveRequest({
                origin: creep.pos,
                goal: {
                    pos: new RoomPosition(25, 25, creep.commune),
                    range: 25,
                },
            });
            continue;
        }
        creep.say(creep.memory.remote);
        if (creep.advancedAttackEnemies()) {
            delete creep.memory.TW;
            continue;
        }
        if (room.name === creep.memory.remote) {
            if (!creep.memory.TW)
                creep.memory.TW = 0;
            else
                creep.memory.TW += 1;
            if (creep.memory.TW > randomIntRange(20, 100)) {
                delete creep.memory.remote;
                if (creep.moveRequest)
                    continue;
                if (!creep.findRemote())
                    continue;
            }
        }
        creep.createMoveRequest({
            origin: creep.pos,
            goal: {
                pos: new RoomPosition(25, 25, creep.memory.remote),
                range: 25,
            },
        });
    }
}
RemoteDefender.prototype.findRemote = function () {
    var _a;
    const creep = this;
    if (creep.memory.remote)
        return true;
    const remoteNamesByEfficacy = (_a = Game.rooms[creep.commune]) === null || _a === void 0 ? void 0 : _a.get('remoteNamesByEfficacy');
    let roomMemory;
    for (const roomName of remoteNamesByEfficacy) {
        roomMemory = Memory.rooms[roomName];
        if (roomMemory.needs[remoteNeedsIndex.minDamage] + roomMemory.needs[remoteNeedsIndex.minHeal] <= 0)
            continue;
        creep.memory.remote = roomName;
        roomMemory.needs[remoteNeedsIndex.minDamage] -= creep.attackStrength;
        roomMemory.needs[remoteNeedsIndex.minHeal] -= creep.healStrength;
        return true;
    }
    return false;
};
RemoteDefender.prototype.advancedAttackEnemies = function () {
    const { room } = this;
    const enemyAttackers = room.enemyAttackers;
    if (!enemyAttackers.length) {
        const enemyCreeps = room.enemyCreeps;
        if (!enemyCreeps.length) {
            return this.aggressiveHeal();
        }
        if (this.passiveHeal())
            return true;
        this.say('EC');
        const enemyCreep = findClosestObject(this.pos, enemyCreeps);
        const range = getRange(this.pos.x, enemyCreep.pos.x, this.pos.y, enemyCreep.pos.y);
        if (range > 1) {
            this.rangedAttack(enemyCreep);
            this.createMoveRequest({
                origin: this.pos,
                goal: { pos: enemyCreep.pos, range: 1 },
            });
            return true;
        }
        this.rangedMassAttack();
        this.moveRequest = pack(enemyCreep.pos);
        return true;
    }
    const enemyAttacker = findClosestObject(this.pos, enemyAttackers);
    const range = getRange(this.pos.x, enemyAttacker.pos.x, this.pos.y, enemyAttacker.pos.y);
    if (range > 3) {
        this.passiveHeal();
        this.createMoveRequest({
            origin: this.pos,
            goal: { pos: enemyAttacker.pos, range: 1 },
        });
        return true;
    }
    this.say('AEA');
    this.heal(this);
    if (range === 1) {
        this.rangedMassAttack();
        this.moveRequest = pack(enemyAttacker.pos);
    }
    else
        this.rangedAttack(enemyAttacker);
    if (this.healStrength < enemyAttacker.attackStrength) {
        if (range === 3)
            return true;
        if (range >= 3) {
            this.createMoveRequest({
                origin: this.pos,
                goal: { pos: enemyAttacker.pos, range: 3 },
            });
            return true;
        }
        this.createMoveRequest({
            origin: this.pos,
            goal: { pos: enemyAttacker.pos, range: 25 },
            flee: true,
        });
        return true;
    }
    if (this.healStrength < enemyAttacker.attackStrength) {
        if (range <= 2) {
            this.createMoveRequest({
                origin: this.pos,
                goal: { pos: enemyAttacker.pos, range: 1 },
                flee: true,
            });
            return true;
        }
    }
    if (range > 1) {
        this.createMoveRequest({
            origin: this.pos,
            goal: { pos: enemyAttacker.pos, range: 1 },
        });
        return true;
    }
    return true;
};

function vanguardManager(room, creepsOfRole) {
    for (const creepName of creepsOfRole) {
        const creep = Game.creeps[creepName];
        const claimTarget = Memory.rooms[creep.commune].claimRequest;
        if (!claimTarget)
            return;
        Memory.claimRequests[Memory.rooms[creep.commune].claimRequest].needs[claimRequestNeedsIndex.vanguard] -=
            creep.parts.work;
        creep.say(claimTarget);
        if (room.name === claimTarget) {
            creep.buildRoom();
            continue;
        }
        creep.createMoveRequest({
            origin: creep.pos,
            goal: { pos: new RoomPosition(25, 25, claimTarget), range: 25 },
            avoidEnemyRanges: true,
            typeWeights: {
                enemy: Infinity,
                ally: Infinity,
                keeper: Infinity,
                commune: 1,
                neutral: 1,
                highway: 1,
            },
        });
    }
}
Vanguard.prototype.travelToSource = function (sourceIndex) {
    const { room } = this;
    this.say('FHP');
    if (!this.findSourcePos(sourceIndex))
        return false;
    this.say('🚬');
    const harvestPos = unpackAsPos(this.memory.packedPos);
    if (getRange(this.pos.x, harvestPos.x, this.pos.y, harvestPos.y) === 0)
        return false;
    this.say(`⏩ ${sourceIndex}`);
    this.createMoveRequest({
        origin: this.pos,
        goal: {
            pos: new RoomPosition(harvestPos.x, harvestPos.y, room.name),
            range: 0,
        },
        avoidEnemyRanges: true,
    });
    return true;
};
Vanguard.prototype.buildRoom = function () {
    const { room } = this;
    if (this.needsResources()) {
        if (!this.findOptimalSourceName())
            return;
        const sourceIndex = this.memory.SI;
        if (this.travelToSource(sourceIndex))
            return;
        if (this.advancedHarvestSource(room.sources[sourceIndex]))
            return;
        return;
    }
    this.advancedBuildCSite();
};

function sourceHarvesterManager(room, creepsOfRole) {
    for (const creepName of creepsOfRole) {
        const creep = Game.creeps[creepName];
        const sourceIndex = creep.memory.SI;
        if (!creep.findSourcePos(sourceIndex))
            return false;
        if (creep.travelToSource())
            continue;
        creep.advancedHarvestSource(room.sources[sourceIndex]);
        if (creep.transferToSourceExtensions())
            continue;
        if (creep.transferToSourceLink())
            continue;
        creep.repairSourceContainer(room.sourceContainers[sourceIndex]);
    }
}
SourceHarvester.prototype.isDying = function () {
    if (this.memory.dying)
        return true;
    if (!this.ticksToLive)
        return false;
    if (this.ticksToLive > this.body.length * CREEP_SPAWN_TIME + (this.room.sourcePaths[this.memory.SI].length - 3))
        return false;
    this.memory.dying = true;
    return true;
};
SourceHarvester.prototype.travelToSource = function () {
    const { room } = this;
    this.say('🚬');
    const harvestPos = unpackAsPos(this.memory.packedPos);
    if (getRange(this.pos.x, harvestPos.x, this.pos.y, harvestPos.y) === 0)
        return false;
    if (this.memory.getPulled)
        return true;
    this.say(`⏩${this.memory.SI}`);
    this.createMoveRequest({
        origin: this.pos,
        goal: {
            pos: new RoomPosition(harvestPos.x, harvestPos.y, room.name),
            range: 0,
        },
        avoidEnemyRanges: true,
    });
    return true;
};
SourceHarvester.prototype.transferToSourceExtensions = function () {
    const { room } = this;
    if (room.energyAvailable === room.energyCapacityAvailable)
        return false;
    if (this.store.getFreeCapacity(RESOURCE_ENERGY) > this.parts.work * HARVEST_POWER)
        return false;
    const adjacentStructures = room.lookForAtArea(LOOK_STRUCTURES, this.pos.y - 1, this.pos.x - 1, this.pos.y + 1, this.pos.x + 1, true);
    for (const adjacentPosData of adjacentStructures) {
        const structure = adjacentPosData.structure;
        if (!structure.store)
            continue;
        if (structure.structureType !== STRUCTURE_EXTENSION)
            continue;
        if (structure.store.getFreeCapacity(RESOURCE_ENERGY) === 0)
            continue;
        this.transfer(structure, RESOURCE_ENERGY);
        return true;
    }
    return false;
};
SourceHarvester.prototype.transferToSourceLink = function () {
    const { room } = this;
    if (this.store.getFreeCapacity(RESOURCE_ENERGY) > this.parts.work * HARVEST_POWER)
        return false;
    const sourceLink = room.sourceLinks[this.memory.SI];
    if (!sourceLink)
        return false;
    return this.advancedTransfer(sourceLink);
};
SourceHarvester.prototype.repairSourceContainer = function (sourceContainer) {
    if (!sourceContainer)
        return false;
    const workPartCount = this.parts.work;
    if (sourceContainer.hitsMax - sourceContainer.hits < workPartCount * REPAIR_POWER)
        return false;
    if (this.store.getUsedCapacity(RESOURCE_ENERGY) < workPartCount && !this.movedResource)
        this.withdraw(sourceContainer, RESOURCE_ENERGY);
    if (this.worked)
        return false;
    const repairResult = this.repair(sourceContainer);
    if (repairResult === OK) {
        this.worked = true;
        const energySpentOnRepairs = Math.min(workPartCount, (sourceContainer.hitsMax - sourceContainer.hits) / REPAIR_POWER);
        if (global.roomStats[this.room.name])
            global.roomStats[this.room.name].eoro += energySpentOnRepairs;
        this.say(`🔧${energySpentOnRepairs * REPAIR_POWER}`);
        return true;
    }
    return false;
};

function remoteCoreAttackerManager(room, creepsOfRole) {
    for (const creepName of creepsOfRole) {
        const creep = Game.creeps[creepName];
        if (!creep.findRemote()) {
            if (room.name === creep.commune) {
                creep.advancedRecycle();
                continue;
            }
            creep.createMoveRequest({
                origin: creep.pos,
                goal: {
                    pos: new RoomPosition(25, 25, creep.commune),
                    range: 25,
                },
            });
            continue;
        }
        creep.say(creep.memory.remote);
        if (creep.advancedAttackCores())
            continue;
        if (room.name === creep.memory.remote) {
            delete creep.memory.remote;
            continue;
        }
        creep.createMoveRequest({
            origin: creep.pos,
            goal: {
                pos: new RoomPosition(25, 25, creep.memory.remote),
                range: 25,
            },
        });
    }
}
RemoteCoreAttacker.prototype.findRemote = function () {
    var _a;
    const creep = this;
    if (creep.memory.remote)
        return true;
    const role = creep.role;
    const remoteNamesByEfficacy = (_a = Game.rooms[creep.commune]) === null || _a === void 0 ? void 0 : _a.get('remoteNamesByEfficacy');
    for (const roomName of remoteNamesByEfficacy) {
        const roomMemory = Memory.rooms[roomName];
        if (roomMemory.needs[remoteNeedsIndex[role]] <= 0)
            continue;
        creep.memory.remote = roomName;
        roomMemory.needs[remoteNeedsIndex[role]] -= 1;
        return true;
    }
    return false;
};
RemoteCoreAttacker.prototype.advancedAttackCores = function () {
    const { room } = this;
    if (!room.structures.invaderCore.length)
        return false;
    const closestCore = room.structures.invaderCore[0];
    if (getRange(this.pos.x, closestCore.pos.x, this.pos.y, closestCore.pos.y) === 1) {
        this.say('🗡️C');
        this.attack(closestCore);
        return true;
    }
    this.say('⏩C');
    this.createMoveRequest({
        origin: this.pos,
        goal: { pos: closestCore.pos, range: 1 },
        avoidEnemyRanges: true,
    });
    return true;
};

function vanguardDefenderManager(room, creepsOfRole) {
    for (const creepName of creepsOfRole) {
        const creep = Game.creeps[creepName];
        const claimTarget = Memory.rooms[creep.commune].claimRequest;
        if (!claimTarget)
            return;
        Memory.claimRequests[Memory.rooms[creep.commune].claimRequest].needs[claimRequestNeedsIndex.vanguardDefender] -=
            creep.strength;
        creep.say(claimTarget);
        if (room.name === claimTarget) {
            if (creep.advancedAttackEnemies())
                continue;
            continue;
        }
        creep.createMoveRequest({
            origin: creep.pos,
            goal: { pos: new RoomPosition(25, 25, claimTarget), range: 25 },
            avoidEnemyRanges: true,
            typeWeights: {
                enemy: Infinity,
                ally: Infinity,
                keeper: Infinity,
                commune: 1,
                neutral: 1,
                highway: 1,
            },
        });
    }
}
VanguardDefender.prototype.advancedAttackEnemies = function () {
    const { room } = this;
    const enemyAttackers = room.enemyAttackers.filter(function (creep) {
        return !creep.isOnExit();
    });
    if (!enemyAttackers.length) {
        const enemyCreeps = room.enemyCreeps.filter(function (creep) {
            return !creep.isOnExit();
        });
        if (!enemyCreeps.length) {
            return this.aggressiveHeal();
        }
        if (this.passiveHeal())
            return true;
        this.say('EC');
        const enemyCreep = findClosestObject(this.pos, enemyCreeps);
        const range = getRange(this.pos.x, enemyCreep.pos.x, this.pos.y, enemyCreep.pos.y);
        if (range > 1) {
            this.rangedAttack(enemyCreep);
            this.createMoveRequest({
                origin: this.pos,
                goal: { pos: enemyCreep.pos, range: 1 },
            });
            return true;
        }
        this.rangedMassAttack();
        this.moveRequest = pack(enemyCreep.pos);
        return true;
    }
    const enemyAttacker = findClosestObject(this.pos, room.enemyAttackers);
    const range = getRange(this.pos.x, enemyAttacker.pos.x, this.pos.y, enemyAttacker.pos.y);
    if (range > 3) {
        this.passiveHeal();
        this.createMoveRequest({
            origin: this.pos,
            goal: { pos: enemyAttacker.pos, range: 1 },
        });
        return true;
    }
    this.say('AEA');
    this.heal(this);
    if (range === 1) {
        this.rangedMassAttack();
        this.moveRequest = pack(enemyAttacker.pos);
    }
    else
        this.rangedAttack(enemyAttacker);
    if (this.healStrength < enemyAttacker.attackStrength) {
        if (range === 3)
            return true;
        if (range >= 3) {
            this.createMoveRequest({
                origin: this.pos,
                goal: { pos: enemyAttacker.pos, range: 3 },
            });
            return true;
        }
        this.createMoveRequest({
            origin: this.pos,
            goal: { pos: enemyAttacker.pos, range: 25 },
            flee: true,
        });
        return true;
    }
    if (this.healStrength < enemyAttacker.attackStrength) {
        if (range <= 2) {
            this.createMoveRequest({
                origin: this.pos,
                goal: { pos: enemyAttacker.pos, range: 1 },
                flee: true,
            });
            return true;
        }
    }
    if (range > 1) {
        this.createMoveRequest({
            origin: this.pos,
            goal: { pos: enemyAttacker.pos, range: 1 },
        });
        return true;
    }
    return true;
};

function remoteDismantlerManager(room, creepsOfRole) {
    for (const creepName of creepsOfRole) {
        const creep = Game.creeps[creepName];
        if (!creep.findRemote()) {
            if (room.name === creep.commune) {
                creep.advancedRecycle();
                continue;
            }
            creep.createMoveRequest({
                origin: creep.pos,
                goal: {
                    pos: new RoomPosition(25, 25, creep.commune),
                    range: 25,
                },
            });
            continue;
        }
        creep.say(creep.memory.remote);
        if (creep.advancedDismantle())
            continue;
        if (room.name === creep.memory.remote) {
            delete creep.memory.remote;
            continue;
        }
        creep.createMoveRequest({
            origin: creep.pos,
            goal: {
                pos: new RoomPosition(25, 25, creep.memory.remote),
                range: 25,
            },
        });
    }
}
RemoteDismantler.prototype.findRemote = function () {
    var _a;
    const creep = this;
    if (creep.memory.remote)
        return true;
    const role = creep.role;
    const remoteNamesByEfficacy = (_a = Game.rooms[creep.commune]) === null || _a === void 0 ? void 0 : _a.get('remoteNamesByEfficacy');
    for (const roomName of remoteNamesByEfficacy) {
        const roomMemory = Memory.rooms[roomName];
        if (roomMemory.needs[remoteNeedsIndex[role]] <= 0)
            continue;
        creep.memory.remote = roomName;
        roomMemory.needs[remoteNeedsIndex[role]] -= 1;
        return true;
    }
    return false;
};
RemoteDismantler.prototype.advancedDismantle = function () {
    const { room } = this;
    let target;
    let range;
    if (this.memory.dismantleTarget) {
        target = findObjectWithID(this.memory.dismantleTarget);
        if (target) {
            range = getRange(this.pos.x, target.pos.x, this.pos.y, target.pos.y);
            if (range > 1) {
                this.createMoveRequest({
                    origin: this.pos,
                    goal: {
                        pos: target.pos,
                        range: 1,
                    },
                    avoidEnemyRanges: true,
                });
                return true;
            }
            this.dismantle(target);
            return true;
        }
    }
    let targets = room.actionableWalls;
    targets = targets.concat(room.find(FIND_HOSTILE_STRUCTURES).filter(function (structure) {
        return structure.structureType != STRUCTURE_INVADER_CORE;
    }));
    if (targets.length) {
        target = this.pos.findClosestByPath(targets, { ignoreRoads: true, ignoreCreeps: true });
        range = getRange(this.pos.x, target.pos.x, this.pos.y, target.pos.y);
        if (range > 1) {
            this.createMoveRequest({
                origin: this.pos,
                goal: {
                    pos: target.pos,
                    range: 1,
                },
                avoidEnemyRanges: true,
            });
            return true;
        }
        this.memory.dismantleTarget = target.id;
        this.dismantle(target);
        return true;
    }
    return false;
};

class Duo {
    constructor(members, assaulter, supporter) {
        this.members = members;
        this.assaulter = assaulter;
        this.supporter = supporter;
    }
    run() { }
    move(opts) { }
    advancedRangedAttack() { }
    advancedAttack() { }
    advancedDismantle() { }
    advancedHeal() { }
}

class Quad {
    constructor(members, assaulters, supporters) {
        this.members = members;
        this.assaulters = assaulters;
        this.supporters = supporters;
    }
    run() { }
    move(opts) { }
    advancedRangedAttack() { }
    advancedAttack() { }
    advancedDismantle() { }
    advancedHeal() { }
}

function antifaAssaulterManager(room, creepsOfRole) {
    for (const creepName of creepsOfRole) {
        const creep = Game.creeps[creepName];
        if (!creep.squad && creep.memory.squadType) {
            if (!creep.findSquad())
                continue;
        }
        if (creep.squad instanceof Quad) {
            if (creep.name === creep.squad.assaulters[0].name)
                creep.squad.run();
            continue;
        }
        if (creep.squad instanceof Duo) {
            if (creep.name === creep.squad.assaulter.name)
                creep.squad.run();
            continue;
        }
        creep.runSingle();
    }
}
AntifaAssaulter.prototype.findSquad = function () {
    return true;
};
AntifaAssaulter.prototype.runSingle = function () {
    const { room } = this;
    if (!this.memory.AR || this.memory.AR === room.name) {
        if (this.memory.squadType === 'rangedAttack') {
            this.advancedRangedAttack();
            return;
        }
        if (this.memory.squadType === 'attack') {
            this.advancedAttack();
            return;
        }
        this.advancedDismantle();
        return;
    }
    this.passiveRangedAttack();
    this.passiveHeal();
    if (this.commune === this.name) {
        this.createMoveRequest({
            origin: this.pos,
            goal: {
                pos: new RoomPosition(25, 25, this.memory.AR),
                range: 25,
            },
        });
        return;
    }
    this.createMoveRequest({
        origin: this.pos,
        goal: {
            pos: new RoomPosition(25, 25, this.memory.AR),
            range: 25,
        },
    });
};
AntifaAssaulter.prototype.advancedRangedAttack = function () {
    const { room } = this;
    const enemyAttackers = room.enemyAttackers.filter(function (creep) {
        return !creep.isOnExit();
    });
    if (!enemyAttackers.length) {
        const enemyCreeps = room.enemyCreeps.filter(function (creep) {
            return !creep.isOnExit();
        });
        if (!enemyCreeps.length) {
            return this.aggressiveHeal();
        }
        if (this.passiveHeal())
            return true;
        this.say('EC');
        const enemyCreep = findClosestObject(this.pos, enemyCreeps);
        const range = getRange(this.pos.x, enemyCreep.pos.x, this.pos.y, enemyCreep.pos.y);
        if (range > 1) {
            this.rangedAttack(enemyCreep);
            this.createMoveRequest({
                origin: this.pos,
                goal: { pos: enemyCreep.pos, range: 1 },
            });
            return true;
        }
        this.rangedMassAttack();
        this.moveRequest = pack(enemyCreep.pos);
        return true;
    }
    const enemyAttacker = findClosestObject(this.pos, enemyAttackers);
    const range = getRange(this.pos.x, enemyAttacker.pos.x, this.pos.y, enemyAttacker.pos.y);
    if (range > 3) {
        this.passiveHeal();
        this.createMoveRequest({
            origin: this.pos,
            goal: { pos: enemyAttacker.pos, range: 1 },
        });
        return true;
    }
    this.say('AEA');
    this.heal(this);
    if (range === 1) {
        this.rangedMassAttack();
        this.moveRequest = pack(enemyAttacker.pos);
    }
    else
        this.rangedAttack(enemyAttacker);
    if (this.healStrength < enemyAttacker.attackStrength) {
        if (range === 3)
            return true;
        if (range >= 3) {
            this.createMoveRequest({
                origin: this.pos,
                goal: { pos: enemyAttacker.pos, range: 3 },
            });
            return true;
        }
        this.createMoveRequest({
            origin: this.pos,
            goal: { pos: enemyAttacker.pos, range: 25 },
            flee: true,
        });
        return true;
    }
    if (this.healStrength < enemyAttacker.attackStrength) {
        if (range <= 2) {
            this.createMoveRequest({
                origin: this.pos,
                goal: { pos: enemyAttacker.pos, range: 1 },
                flee: true,
            });
            return true;
        }
    }
    if (range > 1) {
        this.createMoveRequest({
            origin: this.pos,
            goal: { pos: enemyAttacker.pos, range: 1 },
        });
        return true;
    }
    return true;
};
AntifaAssaulter.prototype.advancedAttack = function () { };
AntifaAssaulter.prototype.advancedDismantle = function () { };

function allyVanguardManager(room, creepsOfRole) {
    for (const creepName of creepsOfRole) {
        const creep = Game.creeps[creepName];
        const request = Memory.rooms[creep.commune].allyCreepRequest;
        if (!request)
            return;
        Memory.allyCreepRequests[Memory.rooms[creep.commune].allyCreepRequest].needs[allyCreepRequestNeedsIndex.allyVanguard] -=
            creep.parts.work;
        creep.say(request);
        if (room.name === request || (creep.memory.remote && room.name === creep.memory.remote)) {
            creep.buildRoom();
            continue;
        }
        creep.createMoveRequest({
            origin: creep.pos,
            goal: { pos: new RoomPosition(25, 25, request), range: 25 },
            avoidEnemyRanges: true,
            typeWeights: {
                enemy: Infinity,
                ally: Infinity,
                keeper: Infinity,
                commune: 1,
                neutral: 1,
                highway: 1,
            },
        });
    }
}
AllyVanguard.prototype.travelToSource = function (sourceName) {
    const { room } = this;
    this.say('FHP');
    if (!this.findSourcePos(sourceName))
        return false;
    this.say('🚬');
    const harvestPos = unpackAsPos(this.memory.packedPos);
    if (getRange(this.pos.x, harvestPos.x, this.pos.y, harvestPos.y) === 0)
        return false;
    this.say(`⏩ ${sourceName}`);
    this.createMoveRequest({
        origin: this.pos,
        goal: {
            pos: new RoomPosition(harvestPos.x, harvestPos.y, room.name),
            range: 0,
        },
        avoidEnemyRanges: true,
    });
    return true;
};
AllyVanguard.prototype.findRemote = function () {
    if (this.memory.remote)
        return true;
    const { room } = this;
    const exitRoomNames = Game.map.describeExits(room.name);
    for (const exitKey in exitRoomNames) {
        const roomName = exitRoomNames[exitKey];
        const roomMemory = Memory.rooms[roomName];
        if (!roomMemory ||
            roomMemory.type === 'enemy' ||
            roomMemory.type === 'enemyRemote' ||
            roomMemory.type === 'keeper' ||
            roomMemory.type === 'ally' ||
            roomMemory.type === 'allyRemote')
            continue;
        this.memory.remote = roomName;
        return true;
    }
    return false;
};
AllyVanguard.prototype.getEnergyFromRemote = function () {
    const { room } = this;
    if (!this.findRemote())
        return;
    if (room.name !== this.memory.remote) {
        this.createMoveRequest({
            origin: this.pos,
            goal: { pos: new RoomPosition(25, 25, this.memory.remote), range: 25 },
            avoidEnemyRanges: true,
        });
        return;
    }
    if (!this.findOptimalSourceName())
        return;
    const sourceIndex = this.memory.SI;
    if (this.travelToSource(sourceIndex))
        return;
    if (this.advancedHarvestSource(room.sources[sourceIndex]))
        return;
};
AllyVanguard.prototype.getEnergyFromRoom = function () {
    const { room } = this;
    if (room.controller && (room.controller.owner || room.controller.reservation)) {
        if (!this.memory.reservations || !this.memory.reservations.length)
            this.reserveWithdrawEnergy();
        if (!this.fulfillReservation()) {
            this.say(this.message);
            return true;
        }
        this.reserveWithdrawEnergy();
        if (!this.fulfillReservation()) {
            this.say(this.message);
            return true;
        }
        if (this.needsResources())
            return false;
        return false;
    }
    if (!this.findOptimalSourceName())
        return true;
    const sourceIndex = this.memory.SI;
    if (this.travelToSource(sourceIndex))
        return true;
    if (this.advancedHarvestSource(room.sources[sourceIndex]))
        return true;
    return true;
};
AllyVanguard.prototype.buildRoom = function () {
    const { room } = this;
    if (this.needsResources()) {
        if (this.memory.remote) {
            this.getEnergyFromRemote();
            return;
        }
        if (!this.getEnergyFromRoom()) {
            this.getEnergyFromRemote();
        }
        return;
    }
    const request = Memory.rooms[this.commune].allyCreepRequest;
    if (room.name !== request) {
        this.createMoveRequest({
            origin: this.pos,
            goal: { pos: new RoomPosition(25, 25, request), range: 25 },
            avoidEnemyRanges: true,
        });
        return;
    }
    this.advancedBuildAllyCSite();
};

const managers = {
    source1Harvester: sourceHarvesterManager,
    source2Harvester: sourceHarvesterManager,
    hauler: haulerManager,
    controllerUpgrader: controllerUpgraderManager,
    builder: builderManager,
    maintainer: maintainerManager,
    mineralHarvester: mineralHarvesterManager,
    hubHauler: hubHaulerManager,
    fastFiller: fastFillerManager,
    meleeDefender: meleeDefenderManager,
    source1RemoteHarvester: source1RemoteHarvesterManager,
    source2RemoteHarvester: source2RemoteHarvesterManager,
    remoteHauler: remoteHaulerManager,
    remoteReserver: remoteReserverManager,
    remoteDefender: remoteDefenderManager,
    remoteCoreAttacker: remoteCoreAttackerManager,
    remoteDismantler: remoteDismantlerManager,
    scout: scoutManager,
    claimer: claimerManager,
    vanguard: vanguardManager,
    vanguardDefender: vanguardDefenderManager,
    allyVanguard: allyVanguardManager,
    antifaAssaulter: antifaAssaulterManager,
    antifaSupporter: () => { },
};
function creepRoleManager(room) {
    if (Memory.cpuLogging)
        var managerCPUStart = Game.cpu.getUsed();
    let roleCPUStart;
    let creepsOfRoleAmount;
    for (const role of creepRoles) {
        roleCPUStart = Game.cpu.getUsed();
        creepsOfRoleAmount = room.myCreeps[role].length;
        if (!room.myCreeps[role].length)
            continue;
        managers[role](room, room.myCreeps[role]);
        customLog(`${role}s`, `Creeps: ${creepsOfRoleAmount}, CPU: ${(Game.cpu.getUsed() - roleCPUStart).toFixed(2)}, CPU Per Creep: ${((Game.cpu.getUsed() - roleCPUStart) / creepsOfRoleAmount).toFixed(2)}`, undefined);
    }
    if (Memory.cpuLogging)
        customLog('Role Manager', `CPU: ${(Game.cpu.getUsed() - managerCPUStart).toFixed(2)}, CPU Per Creep: ${(room.myCreepsAmount ? (Game.cpu.getUsed() - managerCPUStart) /
            room.myCreepsAmount : 0).toFixed(2)}`, undefined, myColors.lightGrey);
}

function trafficManager(room) {
    if (!room.myCreepsAmount)
        return;
    if (Memory.cpuLogging)
        var managerCPUStart = Game.cpu.getUsed();
    for (const role in room.myCreeps) {
        for (const creepName of room.myCreeps[role])
            Game.creeps[creepName].recurseMoveRequest();
    }
    if (Memory.cpuLogging)
        customLog('Traffic Manager', (Game.cpu.getUsed() - managerCPUStart).toFixed(2), undefined, myColors.lightGrey);
}

Room.prototype.roomVisualsManager = function () {
    if (!Memory.roomVisuals)
        return;
    if (Memory.cpuLogging)
        var managerCPUStart = Game.cpu.getUsed();
    if (this.anchor)
        this.visual.rect(this.anchor.x - 0.5, this.anchor.y - 0.5, 1, 1, {
            stroke: myColors.lightBlue,
            fill: 'transparent',
        });
    (() => {
        if (!this.controller)
            return;
        if (this.controller.my) {
            if (this.controller.level < 8)
                this.visual.text(`%${((this.controller.progress / this.controller.progressTotal) * 100).toFixed(2)}`, this.controller.pos.x, this.controller.pos.y - 1, {
                    backgroundColor: 'rgb(255, 0, 0, 0)',
                    font: 0.5,
                    opacity: 1,
                    color: myColors.lightBlue,
                });
            this.visual.text(`${this.controller.level}`, this.controller.pos, {
                backgroundColor: 'rgb(255, 0, 0, 0)',
                font: 0.5,
                opacity: 0.8,
            });
            return;
        }
        if (this.controller.reservation) {
            const color = () => {
                if (this.controller.reservation.username === Memory.me) {
                    return myColors.lightBlue;
                }
                if (Memory.allyList.includes(this.controller.reservation.username)) {
                    return myColors.green;
                }
                return myColors.red;
            };
            this.visual.text(`${this.controller.reservation.ticksToEnd}`, this.controller.pos, {
                backgroundColor: 'rgb(255, 0, 0, 0)',
                font: 0.5,
                opacity: 0.8,
                color: color(),
            });
        }
    })();
    (() => {
        const spawns = this.structures.spawn;
        for (const spawn of spawns) {
            if (!spawn.spawning)
                continue;
            const creep = Game.creeps[spawn.spawning.name];
            if (!creep)
                continue;
            this.visual.text(creep.role, spawn.pos, {
                backgroundColor: 'rgb(255, 0, 0, 0)',
                font: 0.5,
                opacity: 1,
                color: myColors.lightBlue,
            });
            this.visual.text((spawn.spawning.remainingTime - 1).toString(), spawn.pos.x, spawn.pos.y - 1, {
                backgroundColor: 'rgb(255, 0, 0, 0)',
                font: 0.5,
                opacity: 1,
                color: myColors.lightBlue,
            });
        }
    })();
    (() => {
        if (!this.memory.cSiteTargetID)
            return;
        const constructionTarget = findObjectWithID(this.memory.cSiteTargetID);
        if (constructionTarget)
            this.visual.text('🚧', constructionTarget.pos);
    })();
    (() => {
        if (!Memory.baseVisuals)
            return;
        if (!this.memory.planned)
            return;
        for (const stampType in stamps) {
            const stamp = stamps[stampType];
            for (const packedStampAnchor of this.memory.stampAnchors[stampType]) {
                const stampAnchor = unpackAsPos(packedStampAnchor);
                for (const structureType in stamp.structures) {
                    if (structureType === 'empty')
                        continue;
                    for (const pos of stamp.structures[structureType]) {
                        const x = pos.x + stampAnchor.x - stamp.offset;
                        const y = pos.y + stampAnchor.y - stamp.offset;
                        this.visual.structure(x, y, structureType, {
                            opacity: structureType === STRUCTURE_ROAD ? 0.1 : 0.3,
                        });
                    }
                }
            }
        }
        this.visual.connectRoads();
    })();
    if (Memory.cpuLogging)
        customLog('Room Visuals Manager', (Game.cpu.getUsed() - managerCPUStart).toFixed(2), undefined, myColors.lightGrey);
};

const specificRoomManagers = {
    commune: communeManager,
};
function roomManager() {
    if (Memory.cpuLogging)
        var managerCPUStart = Game.cpu.getUsed();
    for (const roomName in Game.rooms) {
        const roomCPUStart = Game.cpu.getUsed();
        const room = Game.rooms[roomName];
        const roomType = room.memory.type;
        const saveStats = Memory.roomStats > 0 && roomTypesUsedForStats.includes(roomType);
        if (saveStats)
            statsManager.roomPreTick(room.name, roomType);
        if (specificRoomManagers[roomType])
            specificRoomManagers[roomType](room);
        creepRoleManager(room);
        trafficManager(room);
        room.roomVisualsManager();
        let logMessage = `Creeps: ${room.myCreepsAmount}`;
        if (Memory.cpuLogging)
            logMessage += `, CPU: ${(Game.cpu.getUsed() - roomCPUStart).toFixed(2)}`;
        if (saveStats)
            statsManager.roomEndTick(room.name, roomType, room);
        customLog(room.name + ' ' + roomType, logMessage, undefined, myColors.midGrey);
    }
    if (Memory.cpuLogging)
        customLog('Room Manager', (Game.cpu.getUsed() - managerCPUStart).toFixed(2), myColors.white, myColors.lightBlue);
}

Object.defineProperties(Room.prototype, {
    global: {
        get() {
            if (global[this.name])
                return global[this.name];
            return (global[this.name] = {});
        },
    },
    anchor: {
        get() {
            if (this._anchor)
                return this._anchor;
            return (this._anchor =
                this.memory.stampAnchors && this.memory.stampAnchors.fastFiller.length
                    ? unpackAsRoomPos(this.memory.stampAnchors.fastFiller[0], this.name)
                    : undefined);
        },
    },
    sources: {
        get() {
            if (this._sources)
                return this._sources;
            this._sources = [];
            if (!this.memory.sourceIds) {
                this.memory.sourceIds = [];
                const sources = this.find(FIND_SOURCES);
                for (const index in sources) {
                    const source = sources[index];
                    source.index = parseInt(index);
                    this.memory.sourceIds.push(source.id);
                    this._sources.push(source);
                }
                return this._sources;
            }
            for (const index in this.memory.sourceIds) {
                const source = findObjectWithID(this.memory.sourceIds[index]);
                source.index = parseInt(index);
                this._sources.push(source);
            }
            return this._sources;
        },
    },
    sourcesByEfficacy: {
        get() {
            if (this._sourcesByEfficacy)
                return this._sourcesByEfficacy;
            return (this._sourcesByEfficacy = this.sources.sort((a, b) => {
                return this.sourcePaths[a.index].length - this.sourcePaths[b.index].length;
            }));
        },
    },
    mineral: {
        get() {
            if (this._mineral)
                return this._mineral;
            return (this._mineral = this.find(FIND_MINERALS)[0]);
        },
    },
    enemyCreeps: {
        get() {
            if (this._enemyCreeps)
                return this._enemyCreeps;
            return (this._enemyCreeps = this.find(FIND_HOSTILE_CREEPS, {
                filter: creep => !Memory.allyList.includes(creep.owner.username),
            }));
        },
    },
    enemyAttackers: {
        get() {
            if (this._enemyAttackers)
                return this._enemyAttackers;
            return this.enemyCreeps.filter(function (creep) {
                return creep.parts.attack + creep.parts.ranged_attack + creep.parts.work > 0;
            });
        },
    },
    allyCreeps: {
        get() {
            if (this._allyCreeps)
                return this._allyCreeps;
            return (this._allyCreeps = this.find(FIND_HOSTILE_CREEPS, {
                filter: creep => Memory.allyList.includes(creep.owner.username),
            }));
        },
    },
    myDamagedCreeps: {
        get() {
            if (this._myDamagedCreeps)
                return this._myDamagedCreeps;
            return (this._myDamagedCreeps = this.find(FIND_MY_CREEPS, {
                filter: creep => creep.hits < creep.hitsMax,
            }));
        },
    },
    allyDamagedCreeps: {
        get() {
            if (this._allyDamagedCreeps)
                return this._allyDamagedCreeps;
            return (this._allyDamagedCreeps = this.allyCreeps.filter(creep => {
                return creep.hits < creep.hitsMax;
            }));
        },
    },
    structures: {
        get() {
            if (this._structures)
                return this._structures;
            this._structures = {};
            for (const structureType of allStructureTypes)
                this._structures[structureType] = [];
            for (const structure of this.find(FIND_STRUCTURES))
                this._structures[structure.structureType].push(structure);
            return this._structures;
        },
    },
    cSites: {
        get() {
            if (this._cSites)
                return this._cSites;
            this._cSites = {};
            for (const structureType of allStructureTypes)
                this._cSites[structureType] = [];
            for (const cSite of this.find(FIND_MY_CONSTRUCTION_SITES))
                this._cSites[cSite.structureType].push(cSite);
            return this._cSites;
        },
    },
    cSiteTarget: {
        get() {
            if (this.memory.cSiteTargetID) {
                const cSiteTarget = findObjectWithID(this.memory.cSiteTargetID);
                if (cSiteTarget)
                    return cSiteTarget;
            }
            if (!this.find(FIND_MY_CONSTRUCTION_SITES).length)
                return false;
            let totalX = 0;
            let totalY = 0;
            let count = 1;
            if (this.anchor) {
                totalX += this.anchor.x;
                totalY += this.anchor.y;
            }
            else {
                totalX += 25;
                totalX += 25;
            }
            for (const creepName of this.myCreeps.builder) {
                const pos = Game.creeps[creepName].pos;
                totalX += pos.x;
                totalY += pos.y;
                count += 1;
            }
            const searchAnchor = new RoomPosition(Math.floor(totalX / count), Math.floor(totalY / count), this.name);
            for (const structureType of structureTypesByBuildPriority) {
                const cSitesOfType = this.cSites[structureType];
                if (!cSitesOfType.length)
                    continue;
                let target = searchAnchor.findClosestByPath(cSitesOfType, {
                    ignoreCreeps: true,
                    ignoreDestructibleStructures: true,
                    range: 3,
                });
                if (!target)
                    target = findClosestObject(searchAnchor, cSitesOfType);
                this.memory.cSiteTargetID = target.id;
                return target;
            }
            return false;
        },
    },
    enemyCSites: {
        get() {
            if (this._enemyCSites)
                return this._enemyCSites;
            return (this._enemyCSites = this.find(FIND_HOSTILE_CONSTRUCTION_SITES, {
                filter: cSite => !Memory.allyList.includes(cSite.owner.username),
            }));
        },
    },
    allyCSites: {
        get() {
            if (this._allyCSites)
                return this._allyCSites;
            return (this._allyCSites = this.find(FIND_HOSTILE_CONSTRUCTION_SITES, {
                filter: cSite => Memory.allyList.includes(cSite.owner.username),
            }));
        },
    },
    allyCSitesByType: {
        get() {
            if (this._allyCSitesByType)
                return this._allyCSitesByType;
            this._allyCSitesByType = {};
            for (const structureType of allStructureTypes)
                this._allyCSitesByType[structureType] = [];
            for (const cSite of this.allyCSites)
                this._allyCSitesByType[cSite.structureType].push(cSite);
            return this._allyCSitesByType;
        },
    },
    spawningStructures: {
        get() {
            if (this._spawningStructures)
                return this._spawningStructures;
            if (!this.anchor)
                return [];
            return (this._spawningStructures = [...this.structures.spawn, ...this.structures.extension]);
        },
    },
    spawningStructuresByPriority: {
        get() {
            if (this._spawningStructuresByPriority)
                return this._spawningStructuresByPriority;
            return (this._spawningStructuresByPriority = this.spawningStructures.sort((a, b) => getRange(a.pos.x, this.anchor.x, a.pos.y, this.anchor.y) -
                getRange(b.pos.x, this.anchor.x, b.pos.y, this.anchor.y)));
        },
    },
    spawningStructuresByNeed: {
        get() {
            if (this._spawningStructuresByNeed)
                return this._spawningStructuresByNeed;
            this._spawningStructuresByNeed = this.spawningStructures;
            for (const index in this.sources) {
                const closestSourcePos = this.sourcePositions[index][0];
                this._spawningStructuresByNeed = this._spawningStructuresByNeed.filter(structure => getRange(structure.pos.x, closestSourcePos.x, structure.pos.y, closestSourcePos.y) > 1);
            }
            if (this.anchor &&
                this.myCreeps.fastFiller.length &&
                ((this.fastFillerLink && this.hubLink && this.storage) ||
                    (this.fastFillerContainerLeft && this.fastFillerContainerRight))) {
                this._spawningStructuresByNeed = this._spawningStructuresByNeed.filter(structure => getRange(structure.pos.x, this.anchor.x, structure.pos.y, this.anchor.y) > 2);
            }
            return this._spawningStructuresByNeed;
        },
    },
    sourcePositions: {
        get() {
            if (this._sourcePositions)
                return this._sourcePositions;
            if (this.memory.SP) {
                this._sourcePositions = [];
                for (const positions of this.memory.SP)
                    this._sourcePositions.push(unpackPosList(positions));
                return this._sourcePositions;
            }
            this.memory.SP = [];
            this._sourcePositions = [];
            let anchor = this.anchor || new RoomPosition(25, 25, this.name);
            if (this.memory.type === 'remote')
                anchor = Game.rooms[this.memory.commune].anchor || new RoomPosition(25, 25, this.name);
            const terrain = Game.map.getRoomTerrain(this.name);
            for (const source of this.sources) {
                const positions = [];
                const adjacentPositions = findPositionsInsideRect(source.pos.x - 1, source.pos.y - 1, source.pos.x + 1, source.pos.y + 1);
                for (const coord of adjacentPositions) {
                    if (terrain.get(coord.x, coord.y) === TERRAIN_MASK_WALL)
                        continue;
                    positions.push(new RoomPosition(coord.x, coord.y, this.name));
                }
                positions.sort((a, b) => {
                    return anchor.getRangeTo(a) - anchor.getRangeTo(b);
                });
                this.memory.SP.push(packPosList(positions));
                this._sourcePositions.push(positions);
            }
            return this._sourcePositions;
        },
    },
    usedSourceCoords: {
        get() {
            if (this._usedSourceCoords)
                return this._usedSourceCoords;
            this._usedSourceCoords = [];
            for (const source of this.sources)
                this._usedSourceCoords.push(new Set());
            const harvesterNames = this.memory.type === 'commune'
                ? this.myCreeps.source1Harvester
                    .concat(this.myCreeps.source2Harvester)
                    .concat(this.myCreeps.vanguard)
                : this.myCreeps.source1RemoteHarvester.concat(this.myCreeps.source2RemoteHarvester);
            for (const creepName of harvesterNames) {
                const creep = Game.creeps[creepName];
                if (creep.isDying())
                    continue;
                if (creep.memory.SI === undefined)
                    continue;
                if (!creep.memory.packedPos)
                    continue;
                this._usedSourceCoords[creep.memory.SI].add(creep.memory.packedPos);
            }
            return this._usedSourceCoords;
        },
    },
    rampartPlans: {
        get() {
            if (this._rampartPlans)
                return this._rampartPlans;
            return (this._rampartPlans = new PathFinder.CostMatrix());
        },
    },
    sourcePaths: {
        get() {
            if (this._sourcePaths)
                return this._sourcePaths;
            this._sourcePaths = [];
            if (this.global.sourcePaths) {
                for (const path of this.global.sourcePaths)
                    this._sourcePaths.push(unpackPosList(path));
                return this._sourcePaths;
            }
            this.global.sourcePaths = [];
            for (const source of this.sources) {
                const path = this.advancedFindPath({
                    origin: source.pos,
                    goal: { pos: this.anchor, range: 3 },
                });
                this._sourcePaths.push(path);
                this.global.sourcePaths.push(packPosList(path));
            }
            return this._sourcePaths;
        },
    },
    upgradePathLength: {
        get() {
            if (this.global.upgradePathLength)
                return this.global.upgradePathLength;
            if (!this.anchor)
                return 0;
            const centerUpgradePos = this.get('centerUpgradePos');
            if (!centerUpgradePos)
                return 0;
            return (this.global.upgradePathLength = this.advancedFindPath({
                origin: centerUpgradePos,
                goal: { pos: this.anchor, range: 3 },
            }).length);
        },
    },
    sourceContainers: {
        get() {
            if (this._sourceContainers)
                return this._sourceContainers;
            if (this.global.sourceContainers) {
                const containers = [];
                for (const ID of this.global.sourceContainers) {
                    const container = findObjectWithID(ID);
                    if (!container)
                        break;
                    containers.push(container);
                }
                if (containers.length === this.sources.length)
                    return (this._sourceContainers = containers);
            }
            this.global.sourceContainers = [];
            const containers = [];
            for (const positions of this.sourcePositions) {
                for (let structure of positions[0].lookFor(LOOK_STRUCTURES)) {
                    if (structure.structureType !== STRUCTURE_CONTAINER)
                        continue;
                    this.global.sourceContainers.push(structure.id);
                    containers.push(structure);
                    break;
                }
            }
            return (this._sourceContainers = containers);
        },
    },
    sourceLinks: {
        get() {
            if (this._sourceLinks)
                return this._sourceLinks;
            if (this.global.sourceLinks) {
                const links = [];
                for (const ID of this.global.sourceLinks) {
                    const link = findObjectWithID(ID);
                    if (!link)
                        break;
                    links.push(link);
                }
                if (links.length === this.sources.length)
                    return (this._sourceLinks = links);
            }
            this.global.sourceLinks = [];
            const links = [];
            for (const positions of this.sourcePositions) {
                const anchor = positions[0];
                const adjacentStructures = this.lookForAtArea(LOOK_STRUCTURES, anchor.y - 1, anchor.x - 1, anchor.y + 1, anchor.x + 1, true);
                for (const posData of adjacentStructures) {
                    const structure = posData.structure;
                    if (structure.structureType !== STRUCTURE_LINK)
                        continue;
                    this.global.sourceLinks.push(structure.id);
                    links.push(structure);
                    break;
                }
            }
            return (this._sourceLinks = links);
        },
    },
    fastFillerContainerLeft: {
        get() {
            if (this.global.fastFillerContainerLeft) {
                const container = findObjectWithID(this.global.fastFillerContainerLeft);
                if (container)
                    return container;
            }
            if (!this.anchor)
                return false;
            for (const structure of this.lookForAt(LOOK_STRUCTURES, this.anchor.x - 2, this.anchor.y)) {
                if (structure.structureType !== STRUCTURE_CONTAINER)
                    continue;
                this.global.fastFillerContainerLeft = structure.id;
                return structure;
            }
            return false;
        },
    },
    fastFillerContainerRight: {
        get() {
            if (this.global.fastFillerContainerRight) {
                const container = findObjectWithID(this.global.fastFillerContainerRight);
                if (container)
                    return container;
            }
            if (!this.anchor)
                return false;
            for (const structure of this.lookForAt(LOOK_STRUCTURES, this.anchor.x + 2, this.anchor.y)) {
                if (structure.structureType !== STRUCTURE_CONTAINER)
                    continue;
                this.global.fastFillerContainerRight = structure.id;
                return structure;
            }
            return false;
        },
    },
    controllerContainer: {
        get() {
            if (this.global.controllerContainer) {
                const container = findObjectWithID(this.global.controllerContainer);
                if (container)
                    return container;
            }
            const centerUpgradePos = this.get('centerUpgradePos');
            if (!centerUpgradePos)
                return false;
            for (const structure of centerUpgradePos.lookFor(LOOK_STRUCTURES)) {
                if (structure.structureType !== STRUCTURE_CONTAINER)
                    continue;
                this.global.controllerContainer = structure.id;
                return structure;
            }
            return false;
        },
    },
    mineralContainer: {
        get() {
            if (this.global.mineralContainer) {
                const container = findObjectWithID(this.global.mineralContainer);
                if (container)
                    return container;
            }
            const mineralHarvestPos = this.get('closestMineralHarvestPos');
            if (!mineralHarvestPos)
                return false;
            for (const structure of mineralHarvestPos.lookFor(LOOK_STRUCTURES)) {
                if (structure.structureType !== STRUCTURE_CONTAINER)
                    continue;
                this.global.mineralContainer = structure.id;
                return structure;
            }
            return false;
        },
    },
    controllerLink: {
        get() {
            if (this.global.controllerLink) {
                const container = findObjectWithID(this.global.controllerLink);
                if (container)
                    return container;
            }
            const centerUpgradePos = this.get('centerUpgradePos');
            if (!centerUpgradePos)
                return false;
            for (const structure of centerUpgradePos.lookFor(LOOK_STRUCTURES)) {
                if (structure.structureType !== STRUCTURE_LINK)
                    continue;
                this.global.controllerLink = structure.id;
                return structure;
            }
            return false;
        },
    },
    fastFillerLink: {
        get() {
            if (this.global.fastFillerLink) {
                const container = findObjectWithID(this.global.fastFillerLink);
                if (container)
                    return container;
            }
            if (!this.anchor)
                return false;
            for (const structure of this.anchor.lookFor(LOOK_STRUCTURES)) {
                if (structure.structureType !== STRUCTURE_LINK)
                    continue;
                this.global.fastFillerLink = structure.id;
                return structure;
            }
            return false;
        },
    },
    hubLink: {
        get() {
            if (this.global.hubLink) {
                const container = findObjectWithID(this.global.hubLink);
                if (container)
                    return container;
            }
            if (!this.memory.stampAnchors.hub)
                return false;
            let hubAnchor = unpackAsPos(this.memory.stampAnchors.hub[0]);
            for (const structure of new RoomPosition(hubAnchor.x - 1, hubAnchor.y - 1, this.name).lookFor(LOOK_STRUCTURES)) {
                if (structure.structureType !== STRUCTURE_LINK)
                    continue;
                this.global.hubLink = structure.id;
                return structure;
            }
            return false;
        },
    },
    creepPositions: {
        get() {
            if (this._creepPositions)
                return this._creepPositions;
            return (this._creepPositions = createPackedPosMap());
        },
    },
    moveRequests: {
        get() {
            if (this._moveRequests)
                return this._moveRequests;
            return (this._moveRequests = createPackedPosMap(true));
        },
    },
    droppedEnergy: {
        get() {
            if (this._droppedEnergy)
                return this._droppedEnergy;
            return (this._droppedEnergy = this.find(FIND_DROPPED_RESOURCES, {
                filter: resource => resource.resourceType === RESOURCE_ENERGY,
            }));
        },
    },
    actionableWalls: {
        get() {
            if (this._actionableWalls)
                return this._actionableWalls;
            return (this._actionableWalls = this.structures.constructedWall.filter(function (structure) {
                return structure.hits;
            }));
        },
    },
    MEWT: {
        get() {
            if (this._MEWT)
                return this._MEWT;
            this._MEWT = [
                ...this.droppedEnergy,
                ...this.find(FIND_TOMBSTONES),
                ...this.find(FIND_RUINS),
                ...this.sourceContainers,
            ];
            return this._MEWT;
        },
    },
    OEWT: {
        get() {
            if (this._OEWT)
                return this._OEWT;
            this._OEWT = [];
            if (this.storage)
                this._OEWT.push(this.storage);
            if (this.terminal)
                this._OEWT.push(this.terminal);
            if (this.structures.factory[0])
                this._OEWT.push(this.structures.factory[0]);
            if (this.structures.nuker[0])
                this._OEWT.push(this.structures.nuker[0]);
            if (this.structures.powerSpawn[0])
                this._OEWT.push(this.structures.powerSpawn[0]);
            return this._OEWT;
        },
    },
    MAWT: {
        get() {
            if (this._MAWT)
                return this._MAWT;
            this._MAWT = this.MEWT;
            return this._MAWT;
        },
    },
    OAWT: {
        get() {
            if (this._OAWT)
                return this._OAWT;
            this._OAWT = this.OEWT;
            return this._OAWT;
        },
    },
    METT: {
        get() {
            if (this._METT)
                return this._METT;
            this._METT = [...this.spawningStructuresByNeed, ...this.structures.tower];
            if (!this.fastFillerContainerLeft && !this.fastFillerContainerRight) {
                for (const creepName of this.myCreeps.builder) {
                    const creep = Game.creeps[creepName];
                    if (creep.spawning)
                        continue;
                    if (creep.store.getCapacity() * 0.5 >= creep.usedStore())
                        this._METT.push(creep);
                }
            }
            return this._METT;
        },
    },
    OETT: {
        get() {
            if (this._OETT)
                return this._OETT;
            this._OETT = [];
            if (this.storage)
                this._OETT.push(this.storage);
            if (this.terminal)
                this._OETT.push(this.terminal);
            if (this.structures.factory[0])
                this._OETT.push(this.structures.factory[0]);
            if (this.structures.nuker[0])
                this._OETT.push(this.structures.nuker[0]);
            if (this.structures.powerSpawn[0])
                this._OETT.push(this.structures.powerSpawn[0]);
            return this._OETT;
        },
    },
    MATT: {
        get() {
            if (this._MATT)
                return this._MATT;
            this._MATT = this.METT;
            return this._MATT;
        },
    },
    OATT: {
        get() {
            if (this._OATT)
                return this._OATT;
            this._OATT = this.OETT;
            return this._OATT;
        },
    },
    MEFTT: {
        get() {
            if (this._MEFTT)
                return this._MEFTT;
            this._MEFTT = [];
            if (this.controllerContainer)
                this._MEFTT.push(this.controllerContainer);
            if (this.controllerLink && !this.hubLink)
                this._MEFTT.push(this.controllerLink);
            if (this.fastFillerContainerLeft)
                this._MEFTT.push(this.fastFillerContainerLeft);
            if (this.fastFillerContainerRight)
                this._MEFTT.push(this.fastFillerContainerRight);
            return this._MEFTT;
        },
    },
    MOFTT: {
        get() {
            if (this._MOFTT)
                return this._MOFTT;
            this._MOFTT = [];
            return this._MOFTT;
        },
    },
});

Object.defineProperties(Resource.prototype, {
    reserveAmount: {
        get() {
            if (this._reserveAmount)
                return this._reserveAmount;
            return this._reserveAmount = this.amount;
        },
        set(newAmount) {
            this._reserveAmount = newAmount;
        },
    },
});

RoomObject.prototype.usedStore = function (resourceType) {
    if (!this.store)
        return 0;
    let amount = 0;
    if (resourceType)
        return this.store[resourceType];
    for (const type in this.store)
        amount += this.store[type];
    return amount;
};
RoomObject.prototype.freeStore = function (resourceType) {
    return this.store.getCapacity(resourceType) - this.usedStore();
};
RoomObject.prototype.freeSpecificStore = function (resourceType) {
    return this.store.getCapacity(resourceType) - this.store[resourceType];
};

Object.defineProperties(Creep.prototype, {
    role: {
        get() {
            if (this._role)
                return this._role;
            return (this._role = this.name.split(' ')[0]);
        },
    },
    cost: {
        get() {
            if (this._cost)
                return this._cost;
            return (this._cost = parseInt(this.name.split(' ')[1]));
        },
    },
    commune: {
        get() {
            if (this._commune)
                return this._commune;
            return (this._commune = this.name.split(' ')[2]);
        }
    },
    reservation: {
        get() {
            if (!this.memory.reservations[0])
                return false;
            return (this._reservation = this.memory.reservations[0]);
        },
    },
    strength: {
        get() {
            if (this._strength)
                return this._strength;
            this._strength = 1;
            for (const part of this.body) {
                switch (part.type) {
                    case RANGED_ATTACK:
                        this._strength +=
                            RANGED_ATTACK_POWER * (part.boost ? BOOSTS[part.type][part.boost].rangedAttack : 1);
                        break;
                    case ATTACK:
                        this._strength += ATTACK_POWER * (part.boost ? BOOSTS[part.type][part.boost].attack : 1);
                        break;
                    case HEAL:
                        this._strength += HEAL_POWER * (part.boost ? BOOSTS[part.type][part.boost].heal : 1);
                        break;
                    case TOUGH:
                        this._strength += 1 + 5 / (part.boost ? BOOSTS[part.type][part.boost].damage : 1);
                        break;
                    default:
                        this._strength += 1;
                }
            }
            return this._strength;
        },
    },
    attackStrength: {
        get() {
            if (this._attackStrength)
                return this._attackStrength;
            this._attackStrength = 1;
            for (const part of this.body) {
                switch (part.type) {
                    case RANGED_ATTACK:
                        this._attackStrength +=
                            RANGED_ATTACK_POWER * (part.boost ? BOOSTS[part.type][part.boost].rangedAttack : 1);
                        break;
                    case ATTACK:
                        this._attackStrength += ATTACK_POWER * (part.boost ? BOOSTS[part.type][part.boost].attack : 1);
                        break;
                    default:
                        this._attackStrength += 1;
                }
            }
            return this._attackStrength;
        },
    },
    healStrength: {
        get() {
            if (this._healStrength)
                return this._healStrength;
            this._healStrength = 0;
            let toughBoost = 0;
            for (const part of this.body) {
                if (part.type === TOUGH) {
                    toughBoost = Math.max(part.boost ? BOOSTS[part.type][part.boost].damage : 0, toughBoost);
                    continue;
                }
                if (part.type === HEAL)
                    this._healStrength += HEAL_POWER * (part.boost ? BOOSTS[part.type][part.boost].heal : 1);
            }
            return (this._healStrength += this._healStrength * toughBoost);
        },
    },
    parts: {
        get() {
            if (this._parts)
                return this._parts;
            this._parts = {};
            for (const part of this.body) {
                this._parts[part.type] ? (this._parts[part.type] += 1) : (this._parts[part.type] = 1);
            }
            return this._parts;
        },
    },
    boosts: {
        get() {
            if (this._boosts)
                return this._boosts;
            this._boosts = {};
            let boost;
            for (const part of this.body) {
                boost = part.boost;
                if (!boost)
                    continue;
                this._boosts[boost] ? (this._boosts[boost] += 1) : (this._boosts[boost] = 1);
            }
            return this._boosts;
        },
    },
    towerDamage: {
        get() {
            if (this._towerDamage)
                return this._towerDamage;
            const { room } = this;
            this._towerDamage = 0;
            for (const tower of room.structures.tower) {
                if (tower.store.getUsedCapacity(RESOURCE_ENERGY) <= 0)
                    continue;
                const range = getRange(this.pos.x, tower.pos.x, this.pos.y, tower.pos.y);
                if (range <= TOWER_OPTIMAL_RANGE) {
                    this._towerDamage += TOWER_POWER_ATTACK;
                    continue;
                }
                const factor = range < TOWER_FALLOFF_RANGE
                    ? (range - TOWER_OPTIMAL_RANGE) / (TOWER_FALLOFF_RANGE - TOWER_OPTIMAL_RANGE)
                    : 1;
                this._towerDamage += Math.floor(TOWER_POWER_ATTACK * (1 - TOWER_FALLOFF * factor));
            }
            const adjacentCreeps = room.lookForAtArea(LOOK_CREEPS, this.pos.y - 3, this.pos.x - 3, this.pos.y + 3, this.pos.x + 3, true);
            for (const posData of adjacentCreeps) {
                if (posData.creep.my || Memory.allyList.includes(posData.creep.owner.username))
                    continue;
                const range = getRange(this.pos.x, posData.creep.pos.x, this.pos.y, posData.creep.pos.y);
                if (range > 3)
                    continue;
                this._towerDamage -= posData.creep.findTotalHealPower(range);
            }
            if (this.boosts.XGHO2 > 0)
                this._towerDamage *= BOOSTS.tough.XGHO2.damage;
            else if (this.boosts.GHO2 > 0)
                this._towerDamage *= BOOSTS.tough.GHO2.damage;
            else if (this.boosts.GO > 0)
                this._towerDamage *= BOOSTS.tough.GO.damage;
            return this._towerDamage;
        },
    },
    message: {
        get() {
            if (this._message)
                return this._message;
            return (this._message = '');
        },
        set(newMessage) {
            this._message = newMessage;
        },
    },
});

class MemHack {
    constructor() {
        this.memory = undefined;
        this.parseTime = -1;
    }
    init() {
        const cpu = Game.cpu.getUsed();
        this.memory = Memory;
        Game.cpu.getUsed() - cpu;
        this.memory = RawMemory._parsed;
    }
    modifyMemory() {
        delete global.Memory;
        global.Memory = this.memory;
        RawMemory._parsed = this.memory;
    }
}
const memHack = new MemHack();
memHack.init();

const loop = function () {
    memHack.modifyMemory();
    internationalManager.run();
    roomManager();
    internationalManager.mapVisualsManager();
    internationalManager.advancedGeneratePixel();
    internationalManager.advancedSellPixels();
    internationalManager.endTickManager();
};

exports.loop = loop;
