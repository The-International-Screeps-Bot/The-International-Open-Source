module.exports = (objects,timeStamp) => {
     const updatedObjects = {}
     const overviewStats = {}

     for (let i = 0; i < objects.length; i++) {
          updatedObjects[objects[i]._id] = objects[i]
          const object = updatedObjects[objects[i]._id]
          object.timestamp = timeStamp

          switch (object.type) {
               case 'controller':
                    if (!object.user) continue
                    switch (object.level) {
                         case 1:
                              object.progressTotal = 200
                              break
                         case 2:
                              object.progressTotal = 45000
                              break
                         case 3:
                              object.progressTotal = 135000
                              break
                         case 4:
                              object.progressTotal = 405000
                              break
                         case 5:
                              object.progressTotal = 1215000
                              break
                         case 6:
                              object.progressTotal = 3645000
                              break
                         case 7:
                              object.progressTotal = 10935000
                              break
                         default:
                              object.progressTotal = 0
                              break
                    }
                    break
               case 'container':
               case 'spawn':
               case 'extension':
                    if (!object.user) continue
                    if (!overviewStats[object.user]) overviewStats[object.user] = {}
                    if (!overviewStats[object.user][object.room])
                         overviewStats[object.user][object.room] = {}
                    if (!overviewStats[object.user][object.room]['structureCounts'])
                         overviewStats[object.user][object.room]['structureCounts'] = {}
                    if (!overviewStats[object.user][object.room]['structureCounts'][object.type])
                         overviewStats[object.user][object.room]['structureCounts'][object.type] = 0
                    overviewStats[object.user][object.room]['structureCounts'][object.type]++
                    break
               case 'creep': {
                    const countPerType = {}
                    if (!object.body) {
                         console.log('No body for creep', JSON.stringify(object))
                         continue
                    }
                    const body = object.body.map(p => p.type)
                    for (let y = 0; y < body.length; y++) {
                         const part = body[y]
                         if (!countPerType[part]) countPerType[part] = 0
                         countPerType[part]++
                    }

                    object.body = countPerType

                    if (!object.user) continue
                    if (!overviewStats[object.user]) overviewStats[object.user] = {}
                    if (!overviewStats[object.user][object.room]) overviewStats[object.user][object.room] = {}
                    if (!overviewStats[object.user][object.room]['creepCounts'])
                         overviewStats[object.user][object.room]['creepCounts'] = 0
                    overviewStats[object.user][object.room]['creepCounts']++
                    break
               }
               case "energy": {
                    let user = Object.entries(overviewStats).find(entry => Object.keys(entry[1]).includes(object.room))
                    if (!user) continue
                    user = user[0]
                    if (!overviewStats[user]) overviewStats[user] = {}
                    if (!overviewStats[user][object.room]) overviewStats[user][object.room] = {}
                    if (!overviewStats[user][object.room]['droppedEnergy'])
                    overviewStats[user][object.room]['droppedEnergy'] = 0
                    overviewStats[user][object.room]['droppedEnergy']+= object.energy
                    break;
               }
                    default:
                    continue
          }
     }
     objects = updatedObjects
     for (const user in overviewStats) {
          if (Object.hasOwnProperty.call(overviewStats, user)) {
               const rooms = overviewStats[user];
               for (const room in rooms) {
                    if (Object.hasOwnProperty.call(rooms, room)) {
                         if (!room['structureCounts']) room['structureCounts'] = {}
                         if (!room['creepCounts']) room['creepCounts'] = 0
                         if (!room['droppedEnergy']) room['droppedEnergy'] = 0
                    }
               }

          }
     }
     return { objects, overviewStats }
}
