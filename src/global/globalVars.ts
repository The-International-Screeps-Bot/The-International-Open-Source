const properties: {} = {
    allyList: [

    ],
    colors: {
        white: '#fff',
        lightGrey: '#eaeaea',
        lightBlue: '#0f66fc',
        black: '#000000',
    },
    creepRoles: [
        'harvester',
    ],
    roomDimensions: 50
}

// If global doesn't have the first aspect of properties

if (!global[Object.keys(properties)[0]]) {

    // Assign properties to globa

    for (let propertyName in properties) {

        global[propertyName] = properties[propertyName]
    }
}
