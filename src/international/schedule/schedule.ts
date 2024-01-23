import { Schedule, ScheduleIntervalTask, ScheduleTask } from "./schedule.types";

export const schedule: Schedule = []

export class ScheduleProcs {
  static addTask(task: ScheduleTask) {

    schedule.push(task)
  }

  static addIntervalTask(task: ScheduleIntervalTask) {

    schedule.push(task)
  }
}
