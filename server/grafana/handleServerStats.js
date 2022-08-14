function objectFilter(obj, predicate) {
    return Object.keys(obj)
        .filter(key => predicate(obj[key]))
        .reduce((res, key) => ((res[key] = obj[key]), res), {})
}

function groupObjectByKey(object, key) {
    return Object.entries(object).reduce((hash, obj) => {
        if (obj[1][key] === undefined) return hash
        // return Object.assign(hash, { [obj[1][key]]: (hash[obj[1][key]] || {}).concat(obj) })
        if (hash[obj[1][key]] === undefined) {
            hash[obj[1][key]] = {}
        }
        return Object.assign(hash, { [obj[1][key]]: Object.assign(hash[obj[1][key]], { [obj[0]]: obj[1] }) })
    }, {})
}

function HandleRoomStats(stats, objects) {
    stats.structureCounts = {
        spawn: 0,
        extension: 0,
        wall: 0,
        rampart: 0,
        link: 0,
        storage: 0,
        tower: 0,
        observer: 0,
        power_spawn: 0,
        extractor: 0,
        lab: 0,
        terminal: 0,
        container: 0,
        nuker: 0,
        factory: 0,
    }
    stats.creepCounts = 0
    stats.droppedEnergy = 0
    stats.creepBodies = {
        move: 0,
        work: 0,
        carry: 0,
        attack: 0,
        ranged_attack: 0,
        tough: 0,
        heal: 0,
        claim: 0,
    }
    const stores = {
        energy: 0,
    }
    stats.creepStore = Object.assign({}, stores)
    stats.tombstoneStore = Object.assign({}, stores)
    stats.structureStore = {}
    const structureKeys = Object.keys(stats.structureCounts)
    structureKeys.forEach(type => {
        stats.structureStore[type] = Object.assign({}, stores)
    })
    stats.constructionSites = {
        count: 0,
        progress: 0,
        total: 0,
    }
    stats.controller = {
        level: 0,
        progress: 0,
        progressTotal: 0,
    }
    stats.mineralAmount = 0

    for (let i = 0; i < objects.length; i++) {
        const object = objects[i]
        if (structureKeys.includes(object.type)) {
            stats.structureCounts[object.type] += 1
            Object.entries(object.store).forEach(([resource, count]) => {
                if (stats.structureStore[object.type][resource] !== undefined)
                    stats.structureStore[object.type][resource] += count
            })
        }
        switch (object.type) {
            case 'creep':
                stats.creepCounts += 1
                Object.entries(object.body).forEach(([part, count]) => {
                    stats.creepBodies[part] += count
                })
                Object.entries(object.store).forEach(([resource, count]) => {
                    if (stats.creepStore[resource] !== undefined) stats.creepStore[resource] += count
                })
                break
            case 'energy':
                stats.droppedEnergy += object.energy
                break
            case 'constructionSite':
                stats.constructionSites.count += 1
                stats.constructionSites.progress += object.progress
                stats.constructionSites.total += object.progressTotal
                break
        }
    }
    return stats
}
function HandleOwnedRoomStats(stats, objects) {
    for (let i = 0; i < objects.length; i++) {
        const object = objects[i]
        switch (object.type) {
            case 'controller':
                stats.controller = {
                    level: object.level,
                    progress: object.progress,
                    progressTotal: object.progressTotal,
                }
                break
            case 'mineral':
                stats.mineralAmount = object.mineralAmount
        }
    }
    return stats
}
function HandleReservedRoomStats(stats, objects) {
    return stats
}

module.exports = (users, roomsObjects) => {
    const stats = {}
    const ownedControllers = objectFilter(roomsObjects, c => c.type === 'controller' && c.user)
    const reservedControllers = objectFilter(roomsObjects, c => c.type === 'controller' && c.reservation)

    for (let i = 0; i < users.length; i++) {
        const user = users[i]
        const ownedRoomNames = Object.values(objectFilter(ownedControllers, c => c.user === user._id)).map(c => c.room)
        const reservedRoomNames = Object.values(
            objectFilter(reservedControllers, c => c.reservation.user === user._id),
        ).map(c => c.room)

        const ownedObjects = objectFilter(roomsObjects, o => ownedRoomNames.includes(o.room))
        const reservedObjects = objectFilter(roomsObjects, o => reservedRoomNames.includes(o.room))

        const groupedOwnedObjects = groupObjectByKey(ownedObjects, 'room')
        const groupedReservedObjects = groupObjectByKey(reservedObjects, 'room')

        const ownedRooms = {}
        Object.entries(groupedOwnedObjects).forEach(([room, objects]) => {
            let roomStats = {}
            objects = Object.values(objects)
            roomStats = HandleRoomStats(roomStats, objects)
            roomStats = HandleOwnedRoomStats(roomStats, objects)
            ownedRooms[room] = roomStats
        })
        Object.entries(groupedReservedObjects).forEach(([room, objects]) => {
            let roomStats = {}
            roomStats = HandleRoomStats(roomStats, objects)
            roomStats = HandleReservedRoomStats(roomStats, objects)
            ownedRooms[room] = roomStats
        })
        const reservedRooms = {}

        stats[user.username] = {
            user: user,
            owned: ownedRooms,
            reserved: reservedRooms,
        }
    }
    return stats
}
