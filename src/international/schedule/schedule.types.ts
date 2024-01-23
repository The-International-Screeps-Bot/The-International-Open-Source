export type Schedule = ScheduleTask[]

/**
 * Union type. If it has one property of a cronTask, it must have the rest
 */
export interface ScheduleTask {
  /**
   * The task's opperation to execute when it is allowed to do so
   */
  opperation(): void
}

export interface ScheduleIntervalTask extends ScheduleTask {
  /**
   * When the task was last ran; or never
   */
  lastRan: number | undefined
  /**
   * How often the run the task
   * Its existence determines wether or not a task is a cronjob
   */
  interval: number
}
