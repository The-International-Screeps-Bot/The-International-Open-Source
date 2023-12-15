import { RoomStatsKeys } from "./constants"

export class TransactionsManager {

  run() {

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

    for (const transactionID of Memory.recordedTransactions) {
      // only delete if it isn't in current data
      if (currentTransactionIDs.has(transactionID)) continue

      Memory.recordedTransactions.delete(transactionID)
    }
  }

  private registerTransaction(transaction: Transaction) {

    // don't register already registered orders
    if (Memory.recordedTransactions.has(transaction.transactionId)) return

    Memory.recordedTransactions.add(transaction.transactionId)

    this.processTransaction(transaction)
  }

  private processTransaction(transaction: Transaction) {

    if (transaction.resourceType !== RESOURCE_ENERGY) return

    if (transaction.sender.username === Memory.me) {

      if (transaction.order) {

        Memory.stats.rooms[transaction.from][RoomStatsKeys.EnergyOutputSold] += transaction.amount
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
    if (transaction.recipient.username === Memory.me) {

      if (transaction.order) {

        Memory.stats.rooms[transaction.from][RoomStatsKeys.EnergyInputBought] += transaction.amount
      }


    }
  }

  /**
   * Wether or not the transfer was domestic
   */
  private isDomestic(from: string, to: string) {

    return (from === to && from === Memory.me)
  }
}

export const transactionsManager = new TransactionsManager()
