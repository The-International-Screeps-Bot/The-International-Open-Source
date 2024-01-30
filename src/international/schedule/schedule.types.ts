export type Schedule = (ScheduleTask | ScheduleIntervalTask)[]

/**
 * Union type. If it has one property of a cronTask, it must have the rest
 */
export interface ScheduleTask {
  /**
   * The task's operation to execute when it is allowed to do so
   */
  operation(): void
}

export interface ScheduleIntervalTask extends ScheduleTask {
  /**
   * How long to sleep the task for before running it again
   */
  sleepUntil: number | undefined
  /**
   * How often the run the task
   * Its existence determines wether or not a task is a cronjob
   */
  interval: number
}
