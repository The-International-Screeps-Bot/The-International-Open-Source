import { Schedule, ScheduleIntervalTask, ScheduleTask } from "./schedule.types";

export const schedule: Schedule = []

export class ScheduleProcs {
  static runSchedule() {

    for (const task of schedule) {

      if (ScheduleProcs.isIntervalTask(task)) {
        this.tryRunIntervalTask(task)
        continue
      }

      task.operation()
    }
  }

  static tryRunIntervalTask(task: ScheduleIntervalTask) {

    // If the task hasn't been ran yet, run it
    if (task.sleepUntil === undefined) {

      task.operation()
      task.sleepUntil = Game.time + task.interval
      return
    }

    if (task.sleepUntil > Game.time) return

    // Otherwise we are ready to be ran

    task.operation()
    task.sleepUntil = Game.time + task.interval
  }

  static isIntervalTask(task: ScheduleTask): task is ScheduleIntervalTask {
    return (<ScheduleIntervalTask>task).interval !== undefined
  }

  static addTask(task: ScheduleTask) {

    schedule.push(task)
  }

  static addIntervalTask(task: ScheduleIntervalTask) {

    schedule.push(task)
  }
}
