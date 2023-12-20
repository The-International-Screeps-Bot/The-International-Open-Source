import { networkManager } from "./networkManager"

export function relu(value: number) {

    return Math.max(0, value)
}

export function mutateDelta() {

    return (Math.random() * networkManager.learningRate - Math.random() * networkManager.learningRate)
}