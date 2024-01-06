interface BasePlansSegment {
  [roomName: string]: string
}

interface ErrorsSegment {
  errors: string[]
  version?: number
}

type RecordedTransactionIDs = { [ID: string]: 1 }

interface IDsSegment {
  /**
   * An object of constrctionsSites with keys of site IDs and properties of the site's age
   */
  constructionSites: { [ID: string]: number }
  /**
   * keys of the transactions' IDs
   */
  recordedTransactionIDs: RecordedTransactionIDs
}
