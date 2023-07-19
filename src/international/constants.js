import { packCoord } from 'other/codec';
import { collectiveManager } from './collective';
import { settings } from './settings';
export var PlayerMemoryKeys;
(function (PlayerMemoryKeys) {
    /**
     * Generally how good their offense is
     */
    PlayerMemoryKeys[PlayerMemoryKeys["offensiveThreat"] = 0] = "offensiveThreat";
    /**
     * Generally how good their defense is
     */
    PlayerMemoryKeys[PlayerMemoryKeys["defensiveStrength"] = 1] = "defensiveStrength";
    /**
     * How much we want them dead
     */
    PlayerMemoryKeys[PlayerMemoryKeys["hate"] = 2] = "hate";
    /**
     * The last time we were attacked by them
     */
    PlayerMemoryKeys[PlayerMemoryKeys["lastAttacked"] = 3] = "lastAttacked";
    /**
     * the positive, non-zero value for which to weight enemy exit retreat threat
     */
    PlayerMemoryKeys[PlayerMemoryKeys["rangeFromExitWeight"] = 4] = "rangeFromExitWeight";
})(PlayerMemoryKeys || (PlayerMemoryKeys = {}));
export const playerDecayKeys = new Set([
    PlayerMemoryKeys.offensiveThreat,
    PlayerMemoryKeys.defensiveStrength,
    PlayerMemoryKeys.hate,
]);
export var WorkRequestKeys;
(function (WorkRequestKeys) {
    WorkRequestKeys[WorkRequestKeys["claimer"] = 0] = "claimer";
    WorkRequestKeys[WorkRequestKeys["vanguard"] = 1] = "vanguard";
    WorkRequestKeys[WorkRequestKeys["abandon"] = 2] = "abandon";
    WorkRequestKeys[WorkRequestKeys["responder"] = 3] = "responder";
    WorkRequestKeys[WorkRequestKeys["priority"] = 4] = "priority";
    WorkRequestKeys[WorkRequestKeys["allyVanguard"] = 5] = "allyVanguard";
    WorkRequestKeys[WorkRequestKeys["forAlly"] = 6] = "forAlly";
    WorkRequestKeys[WorkRequestKeys["hauler"] = 7] = "hauler";
})(WorkRequestKeys || (WorkRequestKeys = {}));
export var HaulRequestKeys;
(function (HaulRequestKeys) {
    HaulRequestKeys[HaulRequestKeys["type"] = 0] = "type";
    HaulRequestKeys[HaulRequestKeys["distance"] = 1] = "distance";
    HaulRequestKeys[HaulRequestKeys["timer"] = 2] = "timer";
    HaulRequestKeys[HaulRequestKeys["priority"] = 3] = "priority";
    HaulRequestKeys[HaulRequestKeys["abandon"] = 4] = "abandon";
    HaulRequestKeys[HaulRequestKeys["responder"] = 5] = "responder";
})(HaulRequestKeys || (HaulRequestKeys = {}));
export var NukeRequestKeys;
(function (NukeRequestKeys) {
    NukeRequestKeys[NukeRequestKeys["x"] = 0] = "x";
    NukeRequestKeys[NukeRequestKeys["y"] = 1] = "y";
    NukeRequestKeys[NukeRequestKeys["responder"] = 2] = "responder";
    NukeRequestKeys[NukeRequestKeys["priority"] = 3] = "priority";
})(NukeRequestKeys || (NukeRequestKeys = {}));
export var DepositRequestKeys;
(function (DepositRequestKeys) {
    DepositRequestKeys[DepositRequestKeys["depositHarvester"] = 0] = "depositHarvester";
    DepositRequestKeys[DepositRequestKeys["depositHauler"] = 1] = "depositHauler";
    DepositRequestKeys[DepositRequestKeys["abandon"] = 2] = "abandon";
    DepositRequestKeys[DepositRequestKeys["responder"] = 3] = "responder";
    /**
     * The type of resource the deposit provides
     */
    DepositRequestKeys[DepositRequestKeys["type"] = 4] = "type";
})(DepositRequestKeys || (DepositRequestKeys = {}));
export var CombatRequestKeys;
(function (CombatRequestKeys) {
    CombatRequestKeys[CombatRequestKeys["abandon"] = 0] = "abandon";
    CombatRequestKeys[CombatRequestKeys["rangedAttack"] = 1] = "rangedAttack";
    CombatRequestKeys[CombatRequestKeys["attack"] = 2] = "attack";
    CombatRequestKeys[CombatRequestKeys["dismantle"] = 3] = "dismantle";
    CombatRequestKeys[CombatRequestKeys["downgrade"] = 4] = "downgrade";
    CombatRequestKeys[CombatRequestKeys["minDamage"] = 5] = "minDamage";
    CombatRequestKeys[CombatRequestKeys["minMeleeHeal"] = 6] = "minMeleeHeal";
    CombatRequestKeys[CombatRequestKeys["minRangedHeal"] = 7] = "minRangedHeal";
    CombatRequestKeys[CombatRequestKeys["maxTowerDamage"] = 8] = "maxTowerDamage";
    CombatRequestKeys[CombatRequestKeys["quads"] = 9] = "quads";
    CombatRequestKeys[CombatRequestKeys["priority"] = 10] = "priority";
    CombatRequestKeys[CombatRequestKeys["quadQuota"] = 11] = "quadQuota";
    CombatRequestKeys[CombatRequestKeys["inactionTimerMax"] = 12] = "inactionTimerMax";
    CombatRequestKeys[CombatRequestKeys["inactionTimer"] = 13] = "inactionTimer";
    CombatRequestKeys[CombatRequestKeys["maxThreat"] = 14] = "maxThreat";
    CombatRequestKeys[CombatRequestKeys["abandonments"] = 15] = "abandonments";
    /**
     * The type of attack request
     */
    CombatRequestKeys[CombatRequestKeys["type"] = 16] = "type";
    CombatRequestKeys[CombatRequestKeys["responder"] = 17] = "responder";
})(CombatRequestKeys || (CombatRequestKeys = {}));
export var CreepRoomLogisticsRequestKeys;
(function (CreepRoomLogisticsRequestKeys) {
    CreepRoomLogisticsRequestKeys[CreepRoomLogisticsRequestKeys["type"] = 0] = "type";
    CreepRoomLogisticsRequestKeys[CreepRoomLogisticsRequestKeys["target"] = 1] = "target";
    CreepRoomLogisticsRequestKeys[CreepRoomLogisticsRequestKeys["resourceType"] = 2] = "resourceType";
    CreepRoomLogisticsRequestKeys[CreepRoomLogisticsRequestKeys["amount"] = 3] = "amount";
    CreepRoomLogisticsRequestKeys[CreepRoomLogisticsRequestKeys["onlyFull"] = 4] = "onlyFull";
    CreepRoomLogisticsRequestKeys[CreepRoomLogisticsRequestKeys["noReserve"] = 5] = "noReserve";
})(CreepRoomLogisticsRequestKeys || (CreepRoomLogisticsRequestKeys = {}));
export var CreepMemoryKeys;
(function (CreepMemoryKeys) {
    CreepMemoryKeys[CreepMemoryKeys["preferRoads"] = 0] = "preferRoads";
    CreepMemoryKeys[CreepMemoryKeys["sourceIndex"] = 1] = "sourceIndex";
    CreepMemoryKeys[CreepMemoryKeys["dying"] = 2] = "dying";
    CreepMemoryKeys[CreepMemoryKeys["packedCoord"] = 3] = "packedCoord";
    CreepMemoryKeys[CreepMemoryKeys["path"] = 4] = "path";
    CreepMemoryKeys[CreepMemoryKeys["goalPos"] = 5] = "goalPos";
    CreepMemoryKeys[CreepMemoryKeys["usedPathForGoal"] = 6] = "usedPathForGoal";
    CreepMemoryKeys[CreepMemoryKeys["lastCache"] = 7] = "lastCache";
    CreepMemoryKeys[CreepMemoryKeys["structureTarget"] = 8] = "structureTarget";
    CreepMemoryKeys[CreepMemoryKeys["remote"] = 9] = "remote";
    CreepMemoryKeys[CreepMemoryKeys["scoutTarget"] = 10] = "scoutTarget";
    CreepMemoryKeys[CreepMemoryKeys["signTarget"] = 11] = "signTarget";
    CreepMemoryKeys[CreepMemoryKeys["roomLogisticsRequests"] = 12] = "roomLogisticsRequests";
    CreepMemoryKeys[CreepMemoryKeys["needsResources"] = 13] = "needsResources";
    CreepMemoryKeys[CreepMemoryKeys["squadSize"] = 14] = "squadSize";
    CreepMemoryKeys[CreepMemoryKeys["squadType"] = 15] = "squadType";
    CreepMemoryKeys[CreepMemoryKeys["squadCombatType"] = 16] = "squadCombatType";
    CreepMemoryKeys[CreepMemoryKeys["isSquadFormed"] = 17] = "isSquadFormed";
    CreepMemoryKeys[CreepMemoryKeys["squadMembers"] = 18] = "squadMembers";
    CreepMemoryKeys[CreepMemoryKeys["quadBulldozeTargets"] = 19] = "quadBulldozeTargets";
    CreepMemoryKeys[CreepMemoryKeys["haulRequest"] = 20] = "haulRequest";
    CreepMemoryKeys[CreepMemoryKeys["ticksWaited"] = 21] = "ticksWaited";
    CreepMemoryKeys[CreepMemoryKeys["recycleTarget"] = 22] = "recycleTarget";
    CreepMemoryKeys[CreepMemoryKeys["rampartOnlyShoving"] = 23] = "rampartOnlyShoving";
    CreepMemoryKeys[CreepMemoryKeys["rampartTarget"] = 24] = "rampartTarget";
    CreepMemoryKeys[CreepMemoryKeys["taskRoom"] = 25] = "taskRoom";
    CreepMemoryKeys[CreepMemoryKeys["getPulled"] = 26] = "getPulled";
    CreepMemoryKeys[CreepMemoryKeys["combatRequest"] = 27] = "combatRequest";
    CreepMemoryKeys[CreepMemoryKeys["flee"] = 28] = "flee";
    CreepMemoryKeys[CreepMemoryKeys["squadMoveType"] = 29] = "squadMoveType";
    CreepMemoryKeys[CreepMemoryKeys["sleepFor"] = 30] = "sleepFor";
    CreepMemoryKeys[CreepMemoryKeys["sleepTime"] = 31] = "sleepTime";
    CreepMemoryKeys[CreepMemoryKeys["targetID"] = 32] = "targetID";
})(CreepMemoryKeys || (CreepMemoryKeys = {}));
export var PowerCreepMemoryKeys;
(function (PowerCreepMemoryKeys) {
    PowerCreepMemoryKeys[PowerCreepMemoryKeys["commune"] = 0] = "commune";
    /**
     * The name of the method queued for operation
     */
    PowerCreepMemoryKeys[PowerCreepMemoryKeys["task"] = 1] = "task";
    PowerCreepMemoryKeys[PowerCreepMemoryKeys["taskTarget"] = 2] = "taskTarget";
    /**
     * The type of power the creep should use
     */
    PowerCreepMemoryKeys[PowerCreepMemoryKeys["taskPower"] = 3] = "taskPower";
    PowerCreepMemoryKeys[PowerCreepMemoryKeys["taskRoom"] = 4] = "taskRoom";
})(PowerCreepMemoryKeys || (PowerCreepMemoryKeys = {}));
export var PowerRequestKeys;
(function (PowerRequestKeys) {
    PowerRequestKeys[PowerRequestKeys["target"] = 0] = "target";
    PowerRequestKeys[PowerRequestKeys["type"] = 1] = "type";
    PowerRequestKeys[PowerRequestKeys["cooldown"] = 2] = "cooldown";
})(PowerRequestKeys || (PowerRequestKeys = {}));
export var RoomTypes;
(function (RoomTypes) {
    RoomTypes[RoomTypes["commune"] = 0] = "commune";
    RoomTypes[RoomTypes["remote"] = 1] = "remote";
    RoomTypes[RoomTypes["ally"] = 2] = "ally";
    RoomTypes[RoomTypes["allyRemote"] = 3] = "allyRemote";
    RoomTypes[RoomTypes["neutral"] = 4] = "neutral";
    RoomTypes[RoomTypes["enemy"] = 5] = "enemy";
    RoomTypes[RoomTypes["enemyRemote"] = 6] = "enemyRemote";
    RoomTypes[RoomTypes["keeper"] = 7] = "keeper";
    RoomTypes[RoomTypes["keeperCenter"] = 8] = "keeperCenter";
    RoomTypes[RoomTypes["highway"] = 9] = "highway";
    RoomTypes[RoomTypes["intersection"] = 10] = "intersection";
})(RoomTypes || (RoomTypes = {}));
export var RoomMemoryKeys;
(function (RoomMemoryKeys) {
    RoomMemoryKeys[RoomMemoryKeys["type"] = 0] = "type";
    RoomMemoryKeys[RoomMemoryKeys["lastScout"] = 1] = "lastScout";
    /**
     * Tells (mostly civilians) if the room is safe (non-undefined number) and what tick it will refresh
     */
    RoomMemoryKeys[RoomMemoryKeys["danger"] = 2] = "danger";
    // Types specific
    RoomMemoryKeys[RoomMemoryKeys["owner"] = 3] = "owner";
    RoomMemoryKeys[RoomMemoryKeys["RCL"] = 4] = "RCL";
    RoomMemoryKeys[RoomMemoryKeys["powerEnabled"] = 5] = "powerEnabled";
    RoomMemoryKeys[RoomMemoryKeys["constructionSiteTarget"] = 6] = "constructionSiteTarget";
    RoomMemoryKeys[RoomMemoryKeys["stampAnchors"] = 7] = "stampAnchors";
    RoomMemoryKeys[RoomMemoryKeys["roadQuota"] = 8] = "roadQuota";
    RoomMemoryKeys[RoomMemoryKeys["communeSources"] = 9] = "communeSources";
    RoomMemoryKeys[RoomMemoryKeys["communeSourceHarvestPositions"] = 10] = "communeSourceHarvestPositions";
    RoomMemoryKeys[RoomMemoryKeys["communeSourcePaths"] = 11] = "communeSourcePaths";
    RoomMemoryKeys[RoomMemoryKeys["mineralPath"] = 12] = "mineralPath";
    RoomMemoryKeys[RoomMemoryKeys["mineralPositions"] = 13] = "mineralPositions";
    RoomMemoryKeys[RoomMemoryKeys["centerUpgradePos"] = 14] = "centerUpgradePos";
    RoomMemoryKeys[RoomMemoryKeys["upgradePositions"] = 15] = "upgradePositions";
    RoomMemoryKeys[RoomMemoryKeys["upgradePath"] = 16] = "upgradePath";
    RoomMemoryKeys[RoomMemoryKeys["basePlans"] = 17] = "basePlans";
    RoomMemoryKeys[RoomMemoryKeys["rampartPlans"] = 18] = "rampartPlans";
    RoomMemoryKeys[RoomMemoryKeys["mineral"] = 19] = "mineral";
    RoomMemoryKeys[RoomMemoryKeys["mineralType"] = 20] = "mineralType";
    RoomMemoryKeys[RoomMemoryKeys["score"] = 21] = "score";
    RoomMemoryKeys[RoomMemoryKeys["dynamicScore"] = 22] = "dynamicScore";
    RoomMemoryKeys[RoomMemoryKeys["dynamicScoreUpdate"] = 23] = "dynamicScoreUpdate";
    RoomMemoryKeys[RoomMemoryKeys["communePlanned"] = 24] = "communePlanned";
    // Commune
    RoomMemoryKeys[RoomMemoryKeys["remotes"] = 25] = "remotes";
    RoomMemoryKeys[RoomMemoryKeys["powerBanks"] = 26] = "powerBanks";
    RoomMemoryKeys[RoomMemoryKeys["deposits"] = 27] = "deposits";
    RoomMemoryKeys[RoomMemoryKeys["workRequest"] = 28] = "workRequest";
    RoomMemoryKeys[RoomMemoryKeys["combatRequests"] = 29] = "combatRequests";
    RoomMemoryKeys[RoomMemoryKeys["haulRequests"] = 30] = "haulRequests";
    RoomMemoryKeys[RoomMemoryKeys["nukeRequest"] = 31] = "nukeRequest";
    RoomMemoryKeys[RoomMemoryKeys["threatened"] = 32] = "threatened";
    RoomMemoryKeys[RoomMemoryKeys["lastAttacked"] = 33] = "lastAttacked";
    RoomMemoryKeys[RoomMemoryKeys["minHaulerCost"] = 34] = "minHaulerCost";
    RoomMemoryKeys[RoomMemoryKeys["minHaulerCostUpdate"] = 35] = "minHaulerCostUpdate";
    RoomMemoryKeys[RoomMemoryKeys["greatestRCL"] = 36] = "greatestRCL";
    /**
     * Wether or not we are trying to have the room go from commune to neutral
     */
    RoomMemoryKeys[RoomMemoryKeys["abandonCommune"] = 37] = "abandonCommune";
    RoomMemoryKeys[RoomMemoryKeys["marketData"] = 38] = "marketData";
    RoomMemoryKeys[RoomMemoryKeys["factoryProduct"] = 39] = "factoryProduct";
    RoomMemoryKeys[RoomMemoryKeys["factoryUsableResources"] = 40] = "factoryUsableResources";
    // Remote
    RoomMemoryKeys[RoomMemoryKeys["commune"] = 41] = "commune";
    RoomMemoryKeys[RoomMemoryKeys["maxSourceIncome"] = 42] = "maxSourceIncome";
    RoomMemoryKeys[RoomMemoryKeys["remoteSourceHarvesters"] = 43] = "remoteSourceHarvesters";
    RoomMemoryKeys[RoomMemoryKeys["remoteHaulers"] = 44] = "remoteHaulers";
    RoomMemoryKeys[RoomMemoryKeys["remoteReserver"] = 45] = "remoteReserver";
    RoomMemoryKeys[RoomMemoryKeys["remoteCoreAttacker"] = 46] = "remoteCoreAttacker";
    RoomMemoryKeys[RoomMemoryKeys["remoteBuilder"] = 47] = "remoteBuilder";
    RoomMemoryKeys[RoomMemoryKeys["remoteDismantler"] = 48] = "remoteDismantler";
    RoomMemoryKeys[RoomMemoryKeys["abandonRemote"] = 49] = "abandonRemote";
    RoomMemoryKeys[RoomMemoryKeys["recursedAbandonment"] = 50] = "recursedAbandonment";
    RoomMemoryKeys[RoomMemoryKeys["use"] = 51] = "use";
    RoomMemoryKeys[RoomMemoryKeys["enemyReserved"] = 52] = "enemyReserved";
    RoomMemoryKeys[RoomMemoryKeys["invaderCore"] = 53] = "invaderCore";
    RoomMemoryKeys[RoomMemoryKeys["disableCachedPaths"] = 54] = "disableCachedPaths";
    RoomMemoryKeys[RoomMemoryKeys["remotePlanned"] = 55] = "remotePlanned";
    RoomMemoryKeys[RoomMemoryKeys["remoteStampAnchors"] = 56] = "remoteStampAnchors";
    RoomMemoryKeys[RoomMemoryKeys["remoteControllerPath"] = 57] = "remoteControllerPath";
    RoomMemoryKeys[RoomMemoryKeys["remoteControllerPositions"] = 58] = "remoteControllerPositions";
    RoomMemoryKeys[RoomMemoryKeys["remoteSources"] = 59] = "remoteSources";
    RoomMemoryKeys[RoomMemoryKeys["remoteSourceHarvestPositions"] = 60] = "remoteSourceHarvestPositions";
    RoomMemoryKeys[RoomMemoryKeys["remoteSourceFastFillerPaths"] = 61] = "remoteSourceFastFillerPaths";
    RoomMemoryKeys[RoomMemoryKeys["remoteSourceHubPaths"] = 62] = "remoteSourceHubPaths";
    RoomMemoryKeys[RoomMemoryKeys["clearedEnemyStructures"] = 63] = "clearedEnemyStructures";
    RoomMemoryKeys[RoomMemoryKeys["lastStructureCheck"] = 64] = "lastStructureCheck";
    RoomMemoryKeys[RoomMemoryKeys["roadsQuota"] = 65] = "roadsQuota";
    RoomMemoryKeys[RoomMemoryKeys["roads"] = 66] = "roads";
    RoomMemoryKeys[RoomMemoryKeys["remoteSourceCredit"] = 67] = "remoteSourceCredit";
    RoomMemoryKeys[RoomMemoryKeys["remoteSourceCreditChange"] = 68] = "remoteSourceCreditChange";
    RoomMemoryKeys[RoomMemoryKeys["remoteSourceCreditReservation"] = 69] = "remoteSourceCreditReservation";
    RoomMemoryKeys[RoomMemoryKeys["hasContainer"] = 70] = "hasContainer";
    /**
     * The names of the rooms the remote has paths through to get to the commune
     */
    RoomMemoryKeys[RoomMemoryKeys["pathsThrough"] = 71] = "pathsThrough";
    // Ally
    // Enemy
    RoomMemoryKeys[RoomMemoryKeys["terminal"] = 72] = "terminal";
    RoomMemoryKeys[RoomMemoryKeys["towers"] = 73] = "towers";
    RoomMemoryKeys[RoomMemoryKeys["energy"] = 74] = "energy";
    RoomMemoryKeys[RoomMemoryKeys["defensiveStrength"] = 75] = "defensiveStrength";
    RoomMemoryKeys[RoomMemoryKeys["offensiveThreat"] = 76] = "offensiveThreat";
    // Intersection
    RoomMemoryKeys[RoomMemoryKeys["portalsTo"] = 77] = "portalsTo";
})(RoomMemoryKeys || (RoomMemoryKeys = {}));
// General
export const mmoShardNames = new Set(['shard0', 'shard1', 'shard2', 'shard3']);
export const roomTypeProperties = new Set([
    // Commune
    RoomMemoryKeys.remotes,
    RoomMemoryKeys.deposits,
    RoomMemoryKeys.powerBanks,
    RoomMemoryKeys.minHaulerCost,
    RoomMemoryKeys.minHaulerCostUpdate,
    RoomMemoryKeys.threatened,
    RoomMemoryKeys.lastAttacked,
    RoomMemoryKeys.abandonCommune,
    RoomMemoryKeys.score,
    RoomMemoryKeys.dynamicScore,
    RoomMemoryKeys.dynamicScoreUpdate,
    RoomMemoryKeys.clearedEnemyStructures,
    // Remote
    RoomMemoryKeys.commune,
    RoomMemoryKeys.remoteSourceFastFillerPaths,
    RoomMemoryKeys.remoteSourceHubPaths,
    RoomMemoryKeys.remoteSourceCredit,
    RoomMemoryKeys.remoteSourceCreditChange,
    RoomMemoryKeys.remoteSourceCreditReservation,
    RoomMemoryKeys.abandonRemote,
    RoomMemoryKeys.recursedAbandonment,
    RoomMemoryKeys.pathsThrough,
    // Ally and Enemy
    RoomMemoryKeys.owner,
    RoomMemoryKeys.RCL,
    // Enemy
    RoomMemoryKeys.powerEnabled,
    RoomMemoryKeys.towers,
    RoomMemoryKeys.terminal,
    RoomMemoryKeys.energy,
    RoomMemoryKeys.offensiveThreat,
    RoomMemoryKeys.defensiveStrength,
    RoomMemoryKeys.portalsTo,
]);
export const roomTypes = {
    [RoomTypes.commune]: new Set([
        RoomMemoryKeys.remotes,
        RoomMemoryKeys.deposits,
        RoomMemoryKeys.powerBanks,
        RoomMemoryKeys.minHaulerCost,
        RoomMemoryKeys.minHaulerCostUpdate,
        RoomMemoryKeys.threatened,
        RoomMemoryKeys.lastAttacked,
        RoomMemoryKeys.abandonCommune,
        RoomMemoryKeys.score,
        RoomMemoryKeys.dynamicScore,
        RoomMemoryKeys.dynamicScoreUpdate,
        RoomMemoryKeys.clearedEnemyStructures,
    ]),
    [RoomTypes.remote]: new Set([
        RoomMemoryKeys.commune,
        RoomMemoryKeys.remoteSourceFastFillerPaths,
        RoomMemoryKeys.remoteSourceHubPaths,
        RoomMemoryKeys.remoteSourceCredit,
        RoomMemoryKeys.remoteSourceCreditChange,
        RoomMemoryKeys.remoteSourceCreditReservation,
        RoomMemoryKeys.abandonRemote,
        RoomMemoryKeys.recursedAbandonment,
        RoomMemoryKeys.pathsThrough,
    ]),
    [RoomTypes.ally]: new Set([RoomMemoryKeys.owner, RoomMemoryKeys.RCL]),
    [RoomTypes.allyRemote]: new Set([RoomMemoryKeys.owner]),
    [RoomTypes.enemy]: new Set([
        RoomMemoryKeys.owner,
        RoomMemoryKeys.RCL,
        RoomMemoryKeys.powerEnabled,
        RoomMemoryKeys.towers,
        RoomMemoryKeys.terminal,
        RoomMemoryKeys.energy,
        RoomMemoryKeys.offensiveThreat,
        RoomMemoryKeys.defensiveStrength,
    ]),
    [RoomTypes.enemyRemote]: new Set([RoomMemoryKeys.owner]),
    [RoomTypes.neutral]: new Set([]),
    [RoomTypes.keeper]: new Set([RoomMemoryKeys.owner]),
    [RoomTypes.keeperCenter]: new Set([RoomMemoryKeys.owner]),
    [RoomTypes.highway]: new Set([]),
    [RoomTypes.intersection]: new Set([RoomMemoryKeys.portalsTo]),
};
export const constantRoomTypes = new Set([
    RoomTypes.keeper,
    RoomTypes.keeperCenter,
    RoomTypes.highway,
    RoomTypes.intersection,
]);
export const roomTypesUsedForStats = [RoomTypes.commune, RoomTypes.remote];
export const creepRoles = [
    'sourceHarvester',
    'hauler',
    'requestHauler',
    'controllerUpgrader',
    'builder',
    'maintainer',
    'mineralHarvester',
    'hubHauler',
    'fastFiller',
    'meleeDefender',
    'rangedDefender',
    'remoteSourceHarvester',
    'remoteHauler',
    'remoteReserver',
    'remoteDefender',
    'remoteCoreAttacker',
    'remoteDismantler',
    'remoteBuilder',
    'scout',
    'claimer',
    'vanguard',
    'allyVanguard',
    'antifaRangedAttacker',
    'antifaAttacker',
    'antifaHealer',
    'antifaDismantler',
    'antifaDowngrader',
];
/**
 * Roles that will interact with the room logistics system
 */
export const roomLogisticsRoles = new Set([
    'sourceHarvester',
    'hauler',
    'builder',
    'maintainer',
    'controllerUpgrader',
    'remoteSourceHarvester',
    'remoteHauler',
    'hubHauler',
    'allyVanguard',
]);
export const communeCreepRoles = new Set([
    'sourceHarvester',
    'hauler',
    'builder',
    'maintainer',
    'controllerUpgrader',
    'hubHauler',
    'fastFiller',
    'mineralHarvester',
    'meleeDefender',
    'rangedDefender',
]);
export const powerCreepClassNames = ['operator'];
/**
 * Which role gets priority in which circumstance. Lowest to highest
 */
export var TrafficPriorities;
(function (TrafficPriorities) {
    TrafficPriorities[TrafficPriorities["remoteHauler"] = 0] = "remoteHauler";
    TrafficPriorities[TrafficPriorities["hauler"] = 1] = "hauler";
    TrafficPriorities[TrafficPriorities["requestHauler"] = 2] = "requestHauler";
    TrafficPriorities[TrafficPriorities["scout"] = 3] = "scout";
    TrafficPriorities[TrafficPriorities["hubHauler"] = 4] = "hubHauler";
    TrafficPriorities[TrafficPriorities["fastFiller"] = 5] = "fastFiller";
    TrafficPriorities[TrafficPriorities["sourceHarvester"] = 6] = "sourceHarvester";
    TrafficPriorities[TrafficPriorities["mineralHarvester"] = 7] = "mineralHarvester";
    TrafficPriorities[TrafficPriorities["remoteSourceHarvester"] = 8] = "remoteSourceHarvester";
    TrafficPriorities[TrafficPriorities["remoteCoreAttacker"] = 9] = "remoteCoreAttacker";
    TrafficPriorities[TrafficPriorities["remoteDismantler"] = 10] = "remoteDismantler";
    TrafficPriorities[TrafficPriorities["remoteReserver"] = 11] = "remoteReserver";
    TrafficPriorities[TrafficPriorities["remoteBuilder"] = 12] = "remoteBuilder";
    TrafficPriorities[TrafficPriorities["vanguard"] = 13] = "vanguard";
    TrafficPriorities[TrafficPriorities["allyVanguard"] = 14] = "allyVanguard";
    TrafficPriorities[TrafficPriorities["controllerUpgrader"] = 15] = "controllerUpgrader";
    TrafficPriorities[TrafficPriorities["builder"] = 16] = "builder";
    TrafficPriorities[TrafficPriorities["claimer"] = 17] = "claimer";
    TrafficPriorities[TrafficPriorities["remoteDefender"] = 18] = "remoteDefender";
    TrafficPriorities[TrafficPriorities["meleeDefender"] = 19] = "meleeDefender";
    TrafficPriorities[TrafficPriorities["rangedDefender"] = 20] = "rangedDefender";
    TrafficPriorities[TrafficPriorities["maintainer"] = 21] = "maintainer";
    TrafficPriorities[TrafficPriorities["antifaDismantler"] = 22] = "antifaDismantler";
    TrafficPriorities[TrafficPriorities["antifaDowngrader"] = 23] = "antifaDowngrader";
    TrafficPriorities[TrafficPriorities["antifaHealer"] = 24] = "antifaHealer";
    TrafficPriorities[TrafficPriorities["antifaAttacker"] = 25] = "antifaAttacker";
    TrafficPriorities[TrafficPriorities["antifaRangedAttacker"] = 26] = "antifaRangedAttacker";
})(TrafficPriorities || (TrafficPriorities = {}));
export const version = `v2.${settings.breakingVersion}.0`;
// Set of messages to randomly apply to commune rooms
export const communeSign = 'A commune of the proletariat. Bourgeoisie not welcome here! ' + version;
// Set of messages to randomly apply to non-commune rooms
export const nonCommuneSigns = [
    'The top 1% have more money than the poorest 4.5 billion',
    'McDonalds workers in the US make $10/hour. In Denmark, as a result of unions, they make $22/hour',
    'We have democracy in our policial system, should we not have it in our companies too?',
    'Workers of the world, unite; you have nothing to lose but your chains!',
    'Real democracy requires democracy in the workplace - Richard Wolff',
    'Adults spend a combined 13 years of their life under a dictatorship: the workplace',
    'Socialism is about worker ownership over the workplace',
    'Are trans women women? Yes. Obviously.',
    'Advancing the LGBTQ+ agenda <3',
    'Does Jeff Bezos work 56,000 times harder than his average worker? Because he gets paid like it',
];
export const chant = [
    'Creeps',
    'of',
    Game.shard.name,
    'unite',
    'you',
    'have',
    'nothing',
    'to',
    'lose',
    'but',
    'your',
    'chains!',
    undefined,
];
/**
 * What to say when one of our creeps dies
 */
export const friendlyDieChants = ['✊', '🛠️'];
/**
 * What to say an enemy creep dies
 */
export const enemyDieChants = ['☮️', '❤️'];
export const roomDimensions = 50;
export const allStructureTypes = [
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
export const buildableStructureTypes = [
    STRUCTURE_SPAWN,
    STRUCTURE_EXTENSION,
    STRUCTURE_ROAD,
    STRUCTURE_WALL,
    STRUCTURE_RAMPART,
    STRUCTURE_LINK,
    STRUCTURE_STORAGE,
    STRUCTURE_TOWER,
    STRUCTURE_OBSERVER,
    STRUCTURE_POWER_SPAWN,
    STRUCTURE_EXTRACTOR,
    STRUCTURE_LAB,
    STRUCTURE_TERMINAL,
    STRUCTURE_CONTAINER,
    STRUCTURE_NUKER,
    STRUCTURE_FACTORY,
];
export const buildableStructuresSet = new Set(buildableStructureTypes);
export const impassibleStructureTypes = [
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
export const impassibleStructureTypesSet = new Set(impassibleStructureTypes);
export const defaultStructureTypesByBuildPriority = [
    STRUCTURE_RAMPART,
    STRUCTURE_WALL,
    STRUCTURE_SPAWN,
    STRUCTURE_EXTENSION,
    STRUCTURE_CONTAINER,
    STRUCTURE_ROAD,
    STRUCTURE_STORAGE,
    STRUCTURE_TOWER,
    STRUCTURE_TERMINAL,
    STRUCTURE_LINK,
    STRUCTURE_EXTRACTOR,
    STRUCTURE_LAB,
    STRUCTURE_FACTORY,
    STRUCTURE_POWER_SPAWN,
    STRUCTURE_NUKER,
    STRUCTURE_OBSERVER,
];
export const structureTypesToProtect = [
    STRUCTURE_SPAWN,
    STRUCTURE_TOWER,
    STRUCTURE_LAB,
    STRUCTURE_TERMINAL,
    STRUCTURE_STORAGE,
    STRUCTURE_FACTORY,
    STRUCTURE_NUKER,
    STRUCTURE_POWER_SPAWN,
    STRUCTURE_OBSERVER,
    STRUCTURE_LINK,
];
export const structureTypesToProtectSet = new Set(structureTypesToProtect);
export const storingStructureTypesSet = new Set([
    STRUCTURE_STORAGE,
    STRUCTURE_TERMINAL,
]);
export const customColors = {
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
    purple: '#8b06a3',
    pink: '#d60ef9',
    orange: '#f27602',
    teal: '#02f2e2',
};
export const remoteStamps = {
    container: {
        offset: 0,
        protectionOffset: 0,
        size: 1,
        structures: {
            container: [{ x: 0, y: 0 }],
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
};
export const stamps = {
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
        size: 0,
        structures: {
            storage: [
                { x: 1, y: 0 },
                { x: 0, y: 1 },
                { x: 2, y: 1 },
                { x: 1, y: 2 },
            ],
        },
    },
    gridExtension: {
        offset: 0,
        protectionOffset: 4,
        size: 1,
        structures: {
            extension: [{ x: 0, y: 0 }],
        },
    },
    inputLab: {
        offset: 0,
        protectionOffset: 4,
        size: 1,
        structures: {
            lab: [{ x: 0, y: 0 }],
        },
    },
    outputLab: {
        offset: 0,
        protectionOffset: 4,
        size: 1,
        structures: {
            lab: [{ x: 0, y: 0 }],
        },
    },
    tower: {
        offset: 0,
        protectionOffset: 4,
        size: 1,
        structures: {
            tower: [{ x: 0, y: 0 }],
        },
    },
    observer: {
        offset: 0,
        protectionOffset: 4,
        size: 1,
        structures: {
            observer: [{ x: 0, y: 0 }],
        },
    },
    nuker: {
        offset: 0,
        protectionOffset: 4,
        size: 1,
        structures: {
            nuker: [{ x: 0, y: 0 }],
        },
    },
    powerSpawn: {
        offset: 0,
        protectionOffset: 4,
        size: 1,
        structures: {
            powerSpawn: [{ x: 0, y: 0 }],
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
    minCutRampart: {
        offset: 0,
        protectionOffset: 0,
        size: 1,
        structures: {
            rampart: [{ x: 0, y: 0 }],
        },
    },
    onboardingRampart: {
        offset: 0,
        protectionOffset: 0,
        size: 1,
        structures: {
            rampart: [{ x: 0, y: 0 }],
        },
    },
    shieldRampart: {
        offset: 0,
        protectionOffset: 0,
        size: 1,
        structures: {
            rampart: [{ x: 0, y: 0 }],
        },
    },
};
export const stampKeys = Object.keys(stamps);
export const minerals = [
    RESOURCE_HYDROGEN,
    RESOURCE_OXYGEN,
    RESOURCE_UTRIUM,
    RESOURCE_KEANIUM,
    RESOURCE_LEMERGIUM,
    RESOURCE_ZYNTHIUM,
    RESOURCE_CATALYST,
];
export const boosts = [RESOURCE_CATALYZED_GHODIUM_ACID];
export const dismantleBoosts = [
    RESOURCE_ZYNTHIUM_HYDRIDE,
    RESOURCE_ZYNTHIUM_ACID,
    RESOURCE_CATALYZED_ZYNTHIUM_ACID,
];
export const dismantleBoostsSet = new Set(dismantleBoosts);
export const allResources = new Set(RESOURCES_ALL);
/**
 * The percent of the terminal to fill with each resource
 */
export const terminalResourceTargets = {
    [RESOURCE_BATTERY]: {
        conditions: function (communeManager) {
            return communeManager.room.roomManager.structures.factory.length;
        },
        min: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.005;
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.015;
        },
    },
    [RESOURCE_ENERGY]: {
        min: function (communeManager) {
            if (communeManager.room.controller.level < 8) {
                if (collectiveManager.funnelOrder[0] === communeManager.room.name) {
                    return communeManager.storedEnergyUpgradeThreshold * 2;
                }
                return communeManager.storedEnergyUpgradeThreshold * 1.2;
            }
            return communeManager.minStoredEnergy;
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.2;
        },
    },
    [RESOURCE_HYDROGEN]: {
        min: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01;
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.027;
        },
    },
    [RESOURCE_OXYGEN]: {
        min: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01;
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.027;
        },
    },
    [RESOURCE_UTRIUM]: {
        min: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01;
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.027;
        },
    },
    [RESOURCE_KEANIUM]: {
        min: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01;
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.027;
        },
    },
    [RESOURCE_LEMERGIUM]: {
        min: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01;
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.027;
        },
    },
    [RESOURCE_ZYNTHIUM]: {
        min: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01;
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.027;
        },
    },
    [RESOURCE_CATALYST]: {
        min: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01;
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.027;
        },
    },
    [RESOURCE_OXIDANT]: {
        min: function (communeManager) {
            return 0;
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01;
        },
    },
    [RESOURCE_REDUCTANT]: {
        min: function (communeManager) {
            return 0;
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01;
        },
    },
    [RESOURCE_ZYNTHIUM_BAR]: {
        min: function (communeManager) {
            return 0;
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01;
        },
    },
    [RESOURCE_LEMERGIUM_BAR]: {
        min: function (communeManager) {
            return 0;
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01;
        },
    },
    [RESOURCE_UTRIUM_BAR]: {
        min: function (communeManager) {
            return 0;
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01;
        },
    },
    [RESOURCE_KEANIUM_BAR]: {
        min: function (communeManager) {
            return 0;
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01;
        },
    },
    [RESOURCE_PURIFIER]: {
        min: function (communeManager) {
            return 0;
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01;
        },
    },
    [RESOURCE_GHODIUM_MELT]: {
        min: function (communeManager) {
            return 0;
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01;
        },
    },
    [RESOURCE_POWER]: {
        conditions: function (communeManager) {
            return communeManager.room.roomManager.structures.powerSpawn.length;
        },
        min: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.002;
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.015;
        },
    },
    [RESOURCE_METAL]: {
        min: function (communeManager) {
            return 0;
        },
        max: function (communeManager) {
            return 0;
        },
    },
    [RESOURCE_BIOMASS]: {
        min: function (communeManager) {
            return 0;
        },
        max: function (communeManager) {
            return 0;
        },
    },
    [RESOURCE_SILICON]: {
        min: function (communeManager) {
            return 0;
        },
        max: function (communeManager) {
            return 0;
        },
    },
    [RESOURCE_MIST]: {
        min: function (communeManager) {
            return 0;
        },
        max: function (communeManager) {
            return 0;
        },
    },
    [RESOURCE_ALLOY]: {
        min: function (communeManager) {
            return 0;
        },
        max: function (communeManager) {
            return 0;
        },
    },
    [RESOURCE_CELL]: {
        min: function (communeManager) {
            return 0;
        },
        max: function (communeManager) {
            return 0;
        },
    },
    [RESOURCE_WIRE]: {
        min: function (communeManager) {
            return 0;
        },
        max: function (communeManager) {
            return 0;
        },
    },
    [RESOURCE_CONDENSATE]: {
        min: function (communeManager) {
            return 0;
        },
        max: function (communeManager) {
            return 0;
        },
    },
    // Boosts
    [RESOURCE_UTRIUM_HYDRIDE]: {
        min: function (communeManager) {
            return 0;
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01;
        },
    },
    [RESOURCE_UTRIUM_OXIDE]: {
        min: function (communeManager) {
            return 0;
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01;
        },
    },
    [RESOURCE_KEANIUM_HYDRIDE]: {
        min: function (communeManager) {
            return 0;
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01;
        },
    },
    [RESOURCE_KEANIUM_OXIDE]: {
        min: function (communeManager) {
            return 0;
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01;
        },
    },
    [RESOURCE_LEMERGIUM_HYDRIDE]: {
        min: function (communeManager) {
            return 0;
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01;
        },
    },
    [RESOURCE_LEMERGIUM_OXIDE]: {
        min: function (communeManager) {
            return 0;
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01;
        },
    },
    [RESOURCE_ZYNTHIUM_HYDRIDE]: {
        min: function (communeManager) {
            return 0;
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01;
        },
    },
    [RESOURCE_ZYNTHIUM_OXIDE]: {
        min: function (communeManager) {
            return 0;
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01;
        },
    },
    [RESOURCE_GHODIUM_HYDRIDE]: {
        min: function (communeManager) {
            return 0;
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01;
        },
    },
    [RESOURCE_GHODIUM_OXIDE]: {
        min: function (communeManager) {
            return 0;
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01;
        },
    },
};
export const antifaRoles = [
    'antifaRangedAttacker',
    'antifaAttacker',
    'antifaHealer',
    'antifaDismantler',
    'antifaDowngrader',
];
/**
 * Roles for which to provide spawnGroups for based on their shared remoteName
 */
export const remoteRoles = /* | 'remoteSourceHarvester' */ [
    /* 'remoteSourceHarvester', */
    'remoteReserver',
    'remoteDefender',
    'remoteCoreAttacker',
    'remoteDismantler',
];
export var RemoteHarvesterRolesBySourceIndex;
(function (RemoteHarvesterRolesBySourceIndex) {
    RemoteHarvesterRolesBySourceIndex[RemoteHarvesterRolesBySourceIndex["remoteSourceHarvester0"] = 0] = "remoteSourceHarvester0";
    RemoteHarvesterRolesBySourceIndex[RemoteHarvesterRolesBySourceIndex["remoteSourceHarvester1"] = 1] = "remoteSourceHarvester1";
})(RemoteHarvesterRolesBySourceIndex || (RemoteHarvesterRolesBySourceIndex = {}));
export var RemoteHaulerRolesBySourceIndex;
(function (RemoteHaulerRolesBySourceIndex) {
    RemoteHaulerRolesBySourceIndex[RemoteHaulerRolesBySourceIndex["remoteHauler0"] = 0] = "remoteHauler0";
    RemoteHaulerRolesBySourceIndex[RemoteHaulerRolesBySourceIndex["remoteHauler1"] = 1] = "remoteHauler1";
})(RemoteHaulerRolesBySourceIndex || (RemoteHaulerRolesBySourceIndex = {}));
export const CPUBucketCapacity = 10000;
export const CPUMaxPerTick = 500;
/**
 * Roles that should attempt relaying
 */
export const relayRoles = new Set(['hauler', 'remoteHauler']);
/**
 * Used to modify the remaining bucket amount, resulting in the default cacheAmount for moveRequests
 */
export const cacheAmountModifier = 25;
export const UNWALKABLE = -1;
export const NORMAL = 0;
export const PROTECTED = 1;
export const TO_EXIT = 2;
export const EXIT = 3;
/**
 * Which structures should be safemoded when attacked
 */
export const safemodeTargets = [
    STRUCTURE_SPAWN,
    STRUCTURE_TOWER,
    STRUCTURE_STORAGE,
    STRUCTURE_TERMINAL,
];
export const safemodeTargetsSet = new Set(safemodeTargets);
/**
 * The number of ticks to wait between hauler size updates
 */
export const haulerUpdateDefault = 1500;
export const rampartUpkeepCost = RAMPART_DECAY_AMOUNT / REPAIR_POWER / RAMPART_DECAY_TIME;
export const roadUpkeepCost = ROAD_DECAY_AMOUNT / REPAIR_POWER / ROAD_DECAY_TIME;
export const containerUpkeepCost = CONTAINER_DECAY / REPAIR_POWER / CONTAINER_DECAY_TIME_OWNED;
export const remoteContainerUpkeepCost = CONTAINER_DECAY / REPAIR_POWER / CONTAINER_DECAY_TIME;
export const minOnboardingRamparts = 1;
export const maxRampartGroupSize = 12;
/**
 * Links should try to send when their store is more or equal to this multiplier
 */
export const linkSendThreshold = 0.9;
/**
 * Links should receive when their store is less or equal to this multiplier
 */
export const linkReceiveTreshold = 0.25;
export const powerSpawnRefillThreshold = 0.1;
/**
 * Offsets from a creep's moveRequest for which to search for relay targets
 */
export const relayOffsets = {
    horizontal: [
        {
            x: 0,
            y: 0,
        },
        {
            x: -1,
            y: 0,
        },
        {
            x: 1,
            y: 0,
        },
    ],
    vertical: [
        {
            x: 0,
            y: 0,
        },
        {
            x: 0,
            y: -1,
        },
        {
            x: 0,
            y: 1,
        },
    ],
    topLeft: [
        {
            x: 0,
            y: 0,
        },
        {
            x: 1,
            y: 0,
        },
        {
            x: 0,
            y: 1,
        },
    ],
    topRight: [
        {
            x: 0,
            y: 0,
        },
        {
            x: -1,
            y: 0,
        },
        {
            x: 0,
            y: 1,
        },
    ],
    bottomLeft: [
        {
            x: 0,
            y: 0,
        },
        {
            x: 1,
            y: 0,
        },
        {
            x: 0,
            y: -1,
        },
    ],
    bottomRight: [
        {
            x: 0,
            y: 0,
        },
        {
            x: -1,
            y: 0,
        },
        {
            x: 0,
            y: -1,
        },
    ],
};
export const squadQuotas = {
    duo: {
        antifaAttacker: {
            antifaAttacker: 1,
            antifaHealer: 1,
        },
        antifaDismantler: {
            antifaDismantler: 1,
            antifaHealer: 1,
        },
    },
    quad: {
        antifaRangedAttacker: {
            antifaRangedAttacker: 4,
        },
        antifaAttacker: {
            antifaAttacker: 1,
            antifaHealer: 3,
        },
        antifaDismantler: {
            antifaDismantler: 1,
            antifaHealer: 3,
        },
    },
    dynamic: {
        antifaRangedAttacker: {
            antifaAttacker: 1,
            antifaHealer: 1,
            antifaRangedAttacker: 1,
            antifaDismantler: 1,
        },
    },
};
export const defaultPlainCost = 1;
export const defaultRoadPlanningPlainCost = 3;
export const defaultSwampCost = 5;
export const defaultCreepSwampCost = 8;
/**
 * @constant 1 4
 * @constant 2 3
 */
export const quadAttackMemberOffsets = [
    {
        x: 0,
        y: 0,
    },
    {
        x: 0,
        y: 1,
    },
    {
        x: 1,
        y: 1,
    },
    {
        x: 1,
        y: 0,
    },
];
export const packedQuadAttackMemberOffsets = quadAttackMemberOffsets.map(coord => packCoord(coord));
export var Result;
(function (Result) {
    Result[Result["fail"] = 0] = "fail";
    Result[Result["success"] = 1] = "success";
    Result[Result["action"] = 2] = "action";
    Result[Result["noAction"] = 3] = "noAction";
    Result[Result["stop"] = 4] = "stop";
})(Result || (Result = {}));
export const maxRemoteRoomDistance = 5;
export const offsetsByDirection = [
    ,
    [0, -1],
    [1, -1],
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
];
export const towerPowers = [PWR_OPERATE_TOWER, PWR_DISRUPT_TOWER];
export const remoteTypeWeights = {
    [RoomTypes.keeper]: Infinity,
    [RoomTypes.enemy]: Infinity,
    [RoomTypes.enemyRemote]: Infinity,
    [RoomTypes.ally]: Infinity,
    [RoomTypes.allyRemote]: Infinity,
};
export const maxWorkRequestDistance = 10;
export const maxCombatDistance = 20;
export const maxHaulDistance = 15;
export const partsByPriority = [
    'tough',
    'claim',
    'attack',
    'ranged_attack',
    'secondaryTough',
    'work',
    'carry',
    'move',
    'secondaryAttack',
    'heal',
];
export const partsByPriorityPartType = {
    [TOUGH]: TOUGH,
    [CLAIM]: CLAIM,
    [ATTACK]: ATTACK,
    [RANGED_ATTACK]: RANGED_ATTACK,
    secondaryTough: TOUGH,
    [WORK]: WORK,
    [CARRY]: CARRY,
    [MOVE]: MOVE,
    secondaryAttack: ATTACK,
    [HEAL]: HEAL,
};
export const rangedMassAttackMultiplierByRange = [1, 1, 0.4, 0.1];
export var RoomStatNamesEnum;
(function (RoomStatNamesEnum) {
    RoomStatNamesEnum["ControllerLevel"] = "cl";
    RoomStatNamesEnum["EnergyInputHarvest"] = "eih";
    RoomStatNamesEnum["EnergyInputBought"] = "eib";
    RoomStatNamesEnum["EnergyOutputUpgrade"] = "eou";
    RoomStatNamesEnum["EnergyOutputRepairOther"] = "eoro";
    RoomStatNamesEnum["EnergyOutputRepairWallOrRampart"] = "eorwr";
    RoomStatNamesEnum["EnergyOutputBuild"] = "eob";
    RoomStatNamesEnum["EnergyOutputSold"] = "eos";
    RoomStatNamesEnum["EnergyOutputSpawn"] = "eosp";
    RoomStatNamesEnum["EnergyOutputPower"] = "eop";
    RoomStatNamesEnum["MineralsHarvested"] = "mh";
    RoomStatNamesEnum["EnergyStored"] = "es";
    RoomStatNamesEnum["BatteriesStoredTimes10"] = "bes";
    RoomStatNamesEnum["CreepCount"] = "cc";
    RoomStatNamesEnum["TotalCreepCount"] = "tcc";
    RoomStatNamesEnum["PowerCreepCount"] = "pcc";
    RoomStatNamesEnum["SpawnUsagePercentage"] = "su";
    RoomStatNamesEnum["AllyCreepRequestManangerCPUUsage"] = "acrmcu";
    RoomStatNamesEnum["WorkRequestManagerCPUUsage"] = "clrmcu";
    RoomStatNamesEnum["TowerManagerCPUUsage"] = "tmcu";
    RoomStatNamesEnum["SpawnManagerCPUUsage"] = "smcu";
    RoomStatNamesEnum["CombatRequestManagerCPUUsage"] = "cormcu";
    RoomStatNamesEnum["DefenceManagerCPUUsage"] = "dmcu";
    RoomStatNamesEnum["SpawnRequestsManagerCPUUsage"] = "srmcu";
    RoomStatNamesEnum["RoomCPUUsage"] = "rocu";
    RoomStatNamesEnum["RoomVisualsManagerCPUUsage"] = "rvmcu";
    RoomStatNamesEnum["ConstructionManagerCPUUsage"] = "cmcu";
    RoomStatNamesEnum["RoleManagerCPUUsage"] = "rolmcu";
    RoomStatNamesEnum["RoleManagerPerCreepCPUUsage"] = "rolmpccu";
    RoomStatNamesEnum["EndTickCreepManagerCPUUsage"] = "etcmcu";
    RoomStatNamesEnum["PowerRoleManagerCPUUsage"] = "prmcu";
    RoomStatNamesEnum["PowerRoleManagerPerCreepCPUUsage"] = "prmpccu";
    RoomStatNamesEnum["GameTime"] = "gt";
    RoomStatNamesEnum["RemoteCount"] = "rc";
    RoomStatNamesEnum["RemoteEnergyStored"] = "res";
    RoomStatNamesEnum["RemoteEnergyInputHarvest"] = "reih";
    RoomStatNamesEnum["RemoteEnergyOutputRepairOther"] = "reoro";
    RoomStatNamesEnum["RemoteEnergyOutputBuild"] = "reob";
    RoomStatNamesEnum["RemoteRoomCPUUsage"] = "rrocu";
    RoomStatNamesEnum["RemoteRoomVisualsManagerCPUUsage"] = "rrvmcu";
    RoomStatNamesEnum["RemoteConstructionManagerCPUUsage"] = "rcmcu";
    RoomStatNamesEnum["RemoteRoleManagerCPUUsage"] = "rrolmcu";
    RoomStatNamesEnum["RemoteRoleManagerPerCreepCPUUsage"] = "rrolmpccu";
    RoomStatNamesEnum["RemoteEndTickCreepManagerCPUUsage"] = "retcmcu";
    RoomStatNamesEnum["RemotePowerRoleManangerCPUUsage"] = "rprmcu";
    RoomStatNamesEnum["RemotePowerRoleManagerPerCreepCPUUsage"] = "rprmpccu";
})(RoomStatNamesEnum || (RoomStatNamesEnum = {}));
export var InternationalStatNamesEnum;
(function (InternationalStatNamesEnum) {
    InternationalStatNamesEnum["CollectiveManagerCPUUsage"] = "imcu";
    InternationalStatNamesEnum["CreepOrganizerCPUUsage"] = "cocu";
    InternationalStatNamesEnum["MapVisualsManangerCPUUsage"] = "mvmcu";
    InternationalStatNamesEnum["PowerCreepOrganizerCPUUsage"] = "pccu";
    InternationalStatNamesEnum["TickInitCPUUsage"] = "tccu";
    InternationalStatNamesEnum["RoomManagerCPUUsage"] = "roomcu";
    InternationalStatNamesEnum["StatsManagerCPUUsage"] = "smcu";
})(InternationalStatNamesEnum || (InternationalStatNamesEnum = {}));
export const packedPosLength = 3;
export const packedCoordLength = 2;
export const cardinalOffsets = [
    {
        x: -1,
        y: 0,
    },
    {
        x: 1,
        y: 0,
    },
    {
        x: 0,
        y: -1,
    },
    {
        x: 0,
        y: 1,
    },
];
export const adjacentOffsets = [
    {
        x: -1,
        y: -1,
    },
    {
        x: 0,
        y: -1,
    },
    {
        x: 1,
        y: -1,
    },
    {
        x: 1,
        y: 0,
    },
    {
        x: 1,
        y: 1,
    },
    {
        x: 0,
        y: 1,
    },
    {
        x: -1,
        y: 1,
    },
    {
        x: -1,
        y: 0,
    },
];
export const defaultMinCutDepth = 7;
/* export const defaultMineralPriority = {
    [H]:
}
 */
export const decayCosts = {
    [STRUCTURE_ROAD]: roadUpkeepCost,
    [STRUCTURE_CONTAINER]: containerUpkeepCost,
};
export const dynamicScoreRoomRange = 8;
export const maxControllerLevel = 8;
export const preferredCommuneRange = 5.5;
export const defaultDataDecay = 0.99999;
export const revolutionary = 'MarvinTMB';
