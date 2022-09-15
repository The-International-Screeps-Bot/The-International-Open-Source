export default class Config {
     static cliPort = 21026
     static tickDuration = 10
     static userCpu = 50
     static playerRooms = { "W1N1": '76561198255104702', "W1N7": "76561198178215469", "W2N5": "76561198092401383" };
     static rooms = {
          "W1N1": 'bot',
          "W6N1": 'bot',
          "W2N5": 'bot',
          "W5N8": 'bot',
          "W7N3": 'bot',
          "W9N9": 'bot',
          "W3N9": 'bot',
          "W8N6": 'bot',
          "W3N3": 'bot',
     };
     static trackedRooms = [
          "W1N1",
          "W5N8",
          "W7N3",
          "W2N5"
     ];
     static milestones = [
          { tick: 10000, check: { level: 2 }, required: true },
          { tick: 15000, check: { level: 3 }, required: false },
          { tick: 45000, check: { level: 4 }, required: false },
     ]
}
