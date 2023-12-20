import { NeuralNetwork } from "./network"


class NetworkManager {
    learningRate = 0.1
    bias = -1
    hiddenLayersCount = 5
    hiddenPerceptronCount = 5

    IDIndex: number
    networks: {[ID: string]: NeuralNetwork}

    constructor() {

        const networkManager = this

        networkManager.networks = {}
        networkManager.IDIndex = 0
    }
    newID() {

        networkManager.IDIndex += 1
        return networkManager.IDIndex.toString()
    }
}

export const networkManager = new NetworkManager()
