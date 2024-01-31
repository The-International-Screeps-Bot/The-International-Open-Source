import { Sleepable } from 'utils/sleepable'
import { IDUpdateInterval, RoomStatsKeys } from '../constants/general'
import { randomIntRange, Utils } from 'utils/utils'
import { CollectiveManager } from './collective'
import { SegmentsManager } from './segments'
import { StatsManager } from './stats'

export class TransactionsManager {
  static run() {
    if (!Utils.isTickInterval(IDUpdateInterval)) return

    const recordedTransactionIDs = SegmentsManager.IDs.recordedTransactionIDs

    const currentTransactionIDs = this.registerCurrentTransactions(recordedTransactionIDs)
    this.pruneRecordedTransactions(recordedTransactionIDs, currentTransactionIDs)
  }

  private static registerCurrentTransactions(recordedTransactionIDs: RecordedTransactionIDs) {
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
  private static pruneRecordedTransactions(
    recordedTransactionIDs: RecordedTransactionIDs,
    currentTransactionIDs: Set<string>,
  ) {
    for (const transactionID in recordedTransactionIDs) {
      // only delete if it isn't in current data
      if (currentTransactionIDs.has(transactionID)) continue

      delete recordedTransactionIDs[transactionID]
    }
  }

  private static registerTransaction(
    recordedTransactionIDs: RecordedTransactionIDs,
    transaction: Transaction,
  ) {
    // don't register already registered orders
    if (recordedTransactionIDs[transaction.transactionId]) return

    recordedTransactionIDs[transaction.transactionId] = 1

    this.processTransaction(transaction)
  }

  private static processTransaction(transaction: Transaction) {
    if (transaction.resourceType !== RESOURCE_ENERGY) return

    if (transaction.sender.username === Memory.me) {
      this.processTransactionMySend(transaction)
    }
    if (transaction.recipient.username === Memory.me) {
      this.processTransactionMyReceive(transaction)
    }
  }

  private static processTransactionMySend(transaction: Transaction) {
    if (!CollectiveManager.communes.has(transaction.from)) return

    if (transaction.order) {
      StatsManager.updateCommuneStat(
        transaction.from,
        RoomStatsKeys.EnergyOutputSold,
        transaction.amount,
      )
      return
    }

    const isDomestic = this.isDomestic(transaction.from, transaction.to)
    if (isDomestic) {
      StatsManager.updateCommuneStat(
        transaction.from,
        RoomStatsKeys.EnergyTerminalSentDomestic,
        transaction.amount,
      )
    }
    // Not a domestic trade
    else {
      StatsManager.updateCommuneStat(
        transaction.from,
        RoomStatsKeys.EnergyTerminalSentOther,
        transaction.amount,
      )
    }
  }

  private static processTransactionMyReceive(transaction: Transaction) {
    if (!CollectiveManager.communes.has(transaction.to)) return

    if (transaction.order) {
      StatsManager.updateCommuneStat(
        transaction.to,
        RoomStatsKeys.EnergyInputBought,
        transaction.amount,
      )
      return
    }
  }

  /**
   * Wether or not the transfer was domestic
   */
  private static isDomestic(from: string, to: string) {
    return CollectiveManager.communes.has(from) && CollectiveManager.communes.has(to)
  }
}

export const transactionsManager = new TransactionsManager()
