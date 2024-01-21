import { Dashboard, Rectangle, Table } from "screeps-viz"

export class RoomProcs {
  tableVisual(room: Room, title: string, headers: string[], data: string[][]) {

    Dashboard({
      config: {
        room: room.name,
      },
      widgets: [
        {
          pos: {
            x: 1,
            y: 1,
          },
          width: 47,
          height: 3 + data.length,
          widget: Rectangle({
            data: Table(() => ({
              data,
              config: {
                label: title,
                headers,
              },
            })),
          }),
        },
      ],
    })
  }
}

export const roomProcs = new RoomProcs()
