function findAnchor(room) {

    if (room.memory.anchorPoint) return true

    if (room.memory.anchorPoint == "noAnchor") return false

    let cm = new PathFinder.CostMatrix()

    cm._bits = distanceTransform(openSpaces())

    let anchorPointResult = displayCostMatrix(cm)

    /*
            the oob parameter is used so that if an object pixel is at the image boundary
            you can avoid having that reduce the pixel's value in the final output. Set
            it to a high value (e.g., 255) for this. Set oob to 0 to treat out of bounds
            as background pixels.
        */
    function distanceTransform(array, oob = 255) {

        // Representation of position and surrounding positions

        var A, B, C;
        var D, E, F;
        var G, H, I;

        var n, value;
        for (n = 0; n < 2500; n++) {
            if (array[n] !== 0) {
                A = array[n - 51];
                B = array[n - 1];
                D = array[n - 50];
                G = array[n - 49];
                if (n % 50 == 0) {
                    A = oob;
                    B = oob;
                }
                if (n % 50 == 49) { G = oob; }
                if (~~(n / 50) == 0) {
                    A = oob;
                    D = oob;
                    G = oob;
                }

                array[n] = (Math.min(A, B, D, G, 254) + 1);
            }
        }

        for (n = 2499; n >= 0; n--) {;
            C = array[n + 49];;
            E = array[n];
            F = array[n + 50];;
            H = array[n + 1];
            I = array[n + 51];
            if (n % 50 == 0) { C = oob; }
            if (n % 50 == 49) {
                H = oob;
                I = oob;
            }
            if (~~(n / 50) == 49) {
                C = oob;
                F = oob;
                I = oob;
            }

            value = Math.min(C + 1, E, F + 1, H + 1, I + 1);
            array[n] = (value);
        }

        return array
    }

    function openSpaces() {

        // Find terrain we can place structures on

        var array = new Uint8Array(2500);
        for (var x = 0; x < 50; ++x) {
            for (var y = 0; y < 50; ++y) {
                if (Game.map.getRoomTerrain(room.name).get(x, y) == '0' || Game.map.getRoomTerrain(room.name).get(x, y) == '2') {
                    array[x * 50 + y] = 1;
                } else {
                    array[x * 50 + y] = 0;
                }
            }
        }

        return array
    }

    function displayCostMatrix(cm) {

        var vis = Game.rooms[room.name].visual;

        const array = cm._bits;

        let anchorPoints = []

        // For open spaces

        for (var x = 0; x < 50; ++x) {
            for (var y = 0; y < 50; ++y) {
                var value = array[x * 50 + y];
                if (value > 0) {

                    vis.circle(x, y, { radius: array[x * 50 + y] / 10, fill: "green" })
                    vis.text((array[x * 50 + y]).toFixed(0), x, y, { font: 0.3 })

                }
                if (value >= 6) {

                    let exits = room.find(FIND_EXIT)

                    for (let exit of exits) {
                        if (exit.getRangeTo(x, y) <= 11) {

                            continue
                        }
                    }

                    anchorPoints.push(new RoomPosition(x, y, room.name))
                }
            }
        }


        if (anchorPoints.length == 0) return false

        let startPoint = room.controller.pos

        anchorPoint = startPoint.findClosestByRange(anchorPoints)

        room.memory.anchorPoint = anchorPoint

        return anchorPoint
    }

    if (anchorPointResult == false) room.memory.anchorPoint = "noAnchor"


    return true
}

module.exports = findAnchor