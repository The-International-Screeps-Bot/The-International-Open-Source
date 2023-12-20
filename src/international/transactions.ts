import { Sleepable } from "utils/sleepable"
import { RoomStatsKeys } from "./constants"
import { randomIntRange } from "utils/utils"
import { collectiveManager } from "./collective"

export class TransactionsManager extends Sleepable {
  sleepFor = randomIntRange(50, 100)

  run() {
    if (this.isSleepingResponsive()) return

    const currentTransactionIDs = this.findCurrentTransactions()
    this.pruneRecordedTransactions(currentTransactionIDs)
  }

  private findCurrentTransactions() {

    const currentTransactionIDs = new Set<string>()

    for (const transaction of Game.market.outgoingTransactions) {

      currentTransactionIDs.add(transaction.transactionId)
      this.registerTransaction(transaction)
    }

    for (const transaction of Game.market.incomingTransactions) {

      currentTransactionIDs.add(transaction.transactionId)
      this.registerTransaction(transaction)
    }

    return currentTransactionIDs
  }

  /**
   * Remove recorded transaction IDs that are no longer present in current data
   */
  private pruneRecordedTransactions(currentTransactionIDs: Set<string>) {

    for (const transactionID in Memory.recordedTransactionIDs) {
      // only delete if it isn't in current data
      if (currentTransactionIDs.has(transactionID)) continue

      Memory.recordedTransactionIDs.transactionID = undefined
    }
  }

  private registerTransaction(transaction: Transaction) {

    // don't register already registered orders
    if (Memory.recordedTransactionIDs[transaction.transactionId]) return

    Memory.recordedTransactionIDs[transaction.transactionId] = 1

    this.processTransaction(transaction)
  }

  private processTransaction(transaction: Transaction) {

    if (transaction.resourceType !== RESOURCE_ENERGY) return

    if (transaction.sender.username === Memory.me) {

      this.processTransactionMySend(transaction)
    }
    if (transaction.recipient.username === Memory.me) {

      this.processTransactionMyReceive(transaction)
    }
  }

  private processTransactionMySend(transaction: Transaction) {

    if (transaction.order) {

      Memory.stats.rooms[transaction.from][RoomStatsKeys.EnergyOutputSold] += transaction.amount
      return
    }

    const isDomestic = this.isDomestic(transaction.from, transaction.to)
    if (isDomestic) {

      Memory.stats.rooms[transaction.from][RoomStatsKeys.EnergyTerminalSentDomestic] += transaction.amount
    }
    // Not a domestic trade
    else {
      Memory.stats.rooms[transaction.from][RoomStatsKeys.EnergyTerminalSentOther] += transaction.amount
    }
  }

  private processTransactionMyReceive(transaction: Transaction) {

    if (transaction.order) {

      Memory.stats.rooms[transaction.to][RoomStatsKeys.EnergyInputBought] += transaction.amount
      return
    }
  }

  /**
   * Wether or not the transfer was domestic
   */
  private isDomestic(from: string, to: string) {

    return (collectiveManager.communes.has(from) && collectiveManager.communes.has(to))
  }
}

export const transactionsManager = new TransactionsManager()
