module.exports = objects => {
    const updatedObjects = {}

    for (let i = 0; i < objects.length; i++) {
        updatedObjects[objects[i]._id] = objects[i]
        const object = updatedObjects[objects[i]._id]

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
            case 'creep': {
                const countPerType = {}
                if (!object.body) continue
                const body = object.body.map(p => p.type)
                for (let y = 0; y < body.length; y++) {
                    const part = body[y]
                    if (!countPerType[part]) countPerType[part] = 0
                    countPerType[part]++
                }

                object.body = countPerType
                break
            }
        }
    }
    return updatedObjects
}
