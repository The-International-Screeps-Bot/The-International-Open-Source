import { Sleepable } from "utils/sleepable"
import { IDUpdateInterval, RoomStatsKeys } from "./constants"
import { randomIntRange, utils } from "utils/utils"
import { collectiveManager } from "./collective"
import { segmentsManager } from "./segments"
import { statsManager } from "./statsManager"

export class TransactionsManager {

  run() {
    if (!utils.isTickInterval(IDUpdateInterval)) return

    const recordedTransactionIDs = segmentsManager.IDs.recordedTransactionIDs

    const currentTransactionIDs = this.registerCurrentTransactions(recordedTransactionIDs)
    this.pruneRecordedTransactions(recordedTransactionIDs, currentTransactionIDs)
  }

  private registerCurrentTransactions(recordedTransactionIDs: RecordedTransactionIDs) {

    const currentTransactionIDs = new Set<string>()

    for (const transaction of Game.market.outgoingTransactions) {

      currentTransactionIDs.add(transaction.transactionId)
      this.registerTransaction(recordedTransactionIDs, transaction)
    }

    for (const transaction of Game.market.incomingTransactions) {

      currentTransactionIDs.add(transaction.transactionId)
      this.registerTransaction(recordedTransactionIDs, transaction)
    }

    return currentTransactionIDs
  }

  /**
   * Remove recorded transaction IDs that are no longer present in current data
   */
  private pruneRecordedTransactions(recordedTransactionIDs: RecordedTransactionIDs, currentTransactionIDs: Set<string>) {

    for (const transactionID in recordedTransactionIDs) {
      // only delete if it isn't in current data
      if (currentTransactionIDs.has(transactionID)) continue

      delete recordedTransactionIDs[transactionID]
    }
  }

  private registerTransaction(recordedTransactionIDs: RecordedTransactionIDs, transaction: Transaction) {

    // don't register already registered orders
    if (recordedTransactionIDs[transaction.transactionId]) return

    recordedTransactionIDs[transaction.transactionId] = 1

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
    if (!collectiveManager.communes.has(transaction.from)) return

    if (transaction.order) {

      statsManager.updateCommuneStat(transaction.from, RoomStatsKeys.EnergyOutputSold, transaction.amount)
      return
    }

    const isDomestic = this.isDomestic(transaction.from, transaction.to)
    if (isDomestic) {

      statsManager.updateCommuneStat(transaction.from, RoomStatsKeys.EnergyTerminalSentDomestic, transaction.amount)
    }
    // Not a domestic trade
    else {
      statsManager.updateCommuneStat(transaction.from, RoomStatsKeys.EnergyTerminalSentOther, transaction.amount)
    }
  }

  private processTransactionMyReceive(transaction: Transaction) {
    if (!collectiveManager.communes.has(transaction.to)) return

    if (transaction.order) {

      statsManager.updateCommuneStat(transaction.to, RoomStatsKeys.EnergyInputBought, transaction.amount)
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
