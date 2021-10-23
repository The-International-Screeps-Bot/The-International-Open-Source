const properties: {[key: string]: any} = {
    allyList: [

    ],
    consoleMessages: {

    },
    creepRoles: [
        "harvester",
    ],
}

// If global doesn't have the first aspect of properties

if (!global[Object.keys(properties)[0]]) {

    // Assign properties to globa

    for (let propertyName in properties) {

        global[propertyName] = properties[propertyName]
    }
}
