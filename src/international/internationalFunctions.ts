/**
 * Generates a pixel at the cost of depleting the bucket if the bucket is full
 */
function advancedGeneratePixel() {

    if (Game.cpu.bucket != 10000) return false

    return Game.cpu.generatePixel()
}
