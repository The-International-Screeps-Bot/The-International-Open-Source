import { networkManager } from "./networkManager"
import { mutateDelta, relu } from "./networkUtils"


export class Input {
    name: string
    values: number[]
    weightIDs: string[]

    constructor(name: string, values: number[], weightIDs: string[]) {

        this.name = name
        this.values = values
        this.weightIDs = weightIDs
    }
}
export class Output {
    name: string

    constructor(name: string) {

        this.name = name
    }
}

export type WeightLayers = number[][][]
export type WeightsByID = {[ID: string]: number}
type ActivationLayers = number[][]

export class NeuralNetwork {
    ID: string
    weightLayers: WeightLayers = []
    /**
     * An ID reference to weights for a set of input perceptrons
     */
    weightsByID: WeightsByID = {}
    /**
     * An input perceptron by input value weight of ids to find the input's weight
     */
    inputWeightLayers: string[][] = []
    activationLayers: ActivationLayers

    constructor(weightLayers: WeightLayers = [], weightsByID: WeightsByID = {}) {

        this.weightLayers = weightLayers
        this.weightsByID = weightsByID

        this.ID = networkManager.newID()
        networkManager.networks[this.ID] = this
    }
    init(inputs: Input[], outputCount: number) {

        this.weightLayers.push([])
        this.activationLayers.push([])

        for (let i = 0; i < inputs.length; i++) {

            const input = inputs[i]
            this.inputWeightLayers.push(input.weightIDs)

            this.weightLayers[0].push([])
            this.activationLayers[0].push(0)

            for (let value_i = 0; value_i < input.values.length; value_i++) {

                this.weightsByID[input.weightIDs[value_i]] = networkManager.bias
                this.weightLayers[0][i].push(networkManager.bias)
            }
        }

        for (let layerIndex = 1; layerIndex < networkManager.hiddenLayersCount + 1; layerIndex++) {

            this.weightLayers.push([])
            this.activationLayers.push([])

            for (let i1 = 0; i1 < networkManager.hiddenPerceptronCount; i1++) {

                this.weightLayers[layerIndex].push([])

                const previousLayerOutputCount = this.activationLayers[layerIndex - 1].length

                for (let i2 = 0; i2 < previousLayerOutputCount; i2++) {

                    this.weightLayers[layerIndex][i1].push(networkManager.bias)
                }

                this.activationLayers[layerIndex].push(0)
            }
        }

        this.weightLayers.push([])
        this.activationLayers.push([])

        const lastLayerIndex = this.activationLayers.length - 1,
            previousLayerOutputCount = this.activationLayers[lastLayerIndex - 1].length

        for (let i1 = 0; i1 < outputCount; i1++) {

            this.weightLayers[lastLayerIndex].push([])

            for (let i2 = 0; i2 < previousLayerOutputCount; i2++) {

                this.weightLayers[lastLayerIndex][i1].push(networkManager.bias)
            }

            this.activationLayers[lastLayerIndex].push(0)
        }
    }

    clone() {

        const newNetwork = new NeuralNetwork(Array.from(this.weightLayers), Object.assign({}, this.weightsByID))

        return newNetwork
    }

    forwardPropagate(inputs: Input[]) {

        // First layer using inputs

        for (let i = 0; i < inputs.length; i++) {

            this.activationLayers[0][i] = 0
        }

        for (let i = 0; i < inputs.length; i++) {

            const input = inputs[i]

            for (let value_i = 0; value_i < input.values.length; value_i++) {

                this.activationLayers[0][i] = relu(input.values[value_i] * this.weightsByID[input.weightIDs[value_i]])
            }
        }

        // Following layers using previous perceptron's values

        for (let layerIndex = 1; layerIndex < this.activationLayers.length; layerIndex++) {

            for (let activationsIndex = 0; activationsIndex < this.activationLayers[layerIndex].length; activationsIndex++) {

                this.activationLayers[layerIndex][activationsIndex] = 0

                for (let previousLayerActivationsIndex = 0; previousLayerActivationsIndex < this.activationLayers[layerIndex - 1].length; previousLayerActivationsIndex++) {

                    this.activationLayers[layerIndex][activationsIndex] += this.activationLayers[layerIndex - 1][previousLayerActivationsIndex] * this.weightLayers[layerIndex][activationsIndex][previousLayerActivationsIndex]
                }

                this.activationLayers[layerIndex][activationsIndex] = relu(this.activationLayers[layerIndex][activationsIndex] + networkManager.bias)
            }
        }
    }
    /*
    backPropagate(scoredOutputs) {

        const network = this


    }
    */
    mutate() {

        // Input layers special for homogenous weights

        for (const ID in this.weightsByID) {

            this.weightsByID[ID] += mutateDelta()
        }

        // Non-input layers

        for (let layerIndex = 0; layerIndex < this.weightLayers.length; layerIndex++) {

            for (let activationsIndex = 0; activationsIndex < this.activationLayers[layerIndex].length; activationsIndex++) {

                for (let weightIndex = 0; weightIndex < this.weightLayers[layerIndex][activationsIndex].length; weightIndex++) {

                    this.weightLayers[layerIndex][activationsIndex][weightIndex] += mutateDelta()
                }
            }
        }
    }
    registerSelf() {

        Memory.networks ??= {
            towers: {
                weightLayers: Array.from(this.weightLayers),
                weightsByID: Object.assign({}, this.weightsByID),
            }
        }
    }
    registerWeights() {

        Memory.networks.towers = {
            weightLayers: Array.from(this.weightLayers),
            weightsByID: Object.assign({}, this.weightsByID),
        }
    }
}
