import { time } from 'console'

export class DebugUtils {
  /**
   * Deeply stringifies values with some added benefits
   */
  static stringify(v: any) {
    let alreadyReferencedObjects: any[] = []
    const recStringify = (value: any, depth: number): string => {
      switch (typeof value) {
        case 'undefined':
          return 'undefined'
        case 'boolean':
        case 'number':
          return value.toString()
        case 'string':
          return '"' + value.toString() + '"'
        case 'object':
          if (value === null) return 'null'
          else if (value instanceof RoomPosition) {
            return `<a href="#!/room/${Game.shard.name}/${value.roomName}">[${value.roomName} ${value.x},${value.y}]</a>`
          } else if (alreadyReferencedObjects.includes(value)) return '*'
          else {
            alreadyReferencedObjects.push(value)
            if (value instanceof Array) {
              if (value.length === 0) return '[]'
              else {
                let leftPad = new Array(depth).fill('  ').join('')
                let itemLeftPad = new Array(depth + 1).fill('  ').join('')
                return (
                  '[<br/>' +
                  value.map(item => itemLeftPad + recStringify(item, depth + 1)).join(',<br/>') +
                  '<br/>' +
                  leftPad +
                  ']'
                )
              }
            } else {
              let entries = Object.entries(value)
              if (entries.length === 0) return '{}'
              else {
                let leftPad = new Array(depth).fill('  ').join('')
                let itemLeftPad = new Array(depth + 1).fill('  ').join('')
                return (
                  '{<br/>' +
                  entries
                    .map(entry => itemLeftPad + entry[0] + ': ' + recStringify(entry[1], depth + 1))
                    .join(',<br/>') +
                  '<br/>' +
                  leftPad +
                  '}'
                )
              }
            }
          }
        default:
          return ''
      }
    }

    return recStringify(v, 0)
  }

  /**
   * I don't fully understand what this does or what it is meant to do
   */
  static findGlobalLength() {
    const dict: { [key: number]: string } = {
      0: '',
      3: 'K',
      6: 'M',
      9: 'G',
      12: 'T',
      15: 'P',
      18: 'E',
      21: 'Z',
      24: 'Y',
    }
    const numDict = function (number: number, precision: number) {
      const num = '' + Math.floor(number),
        l = num.length,
        r = l % 3 || 3,
        sc = l - r
      let string = ''
      for (const x of num) {
        if (parseFloat(x) == r) {
          if (precision) string += '.'
          else break
        }
        if (parseFloat(x) < r + precision) string += num[parseFloat(x)]
      }
      return string + (dict[sc] || '')
    }

    return function (l = 50000, precision = 2) {
      const obj = { max: 0, entries: [] as any }
      for (const x in global) {
        if (x == 'global' || x == 'Memory') continue
        const string = JSON.stringify((global as any)[x])
        if (string && string.length > l) {
          obj.max = Math.max(obj.max, x.length)
          obj.entries.push({ name: x, length: string.length })
        }
      }
      let string = 'Global entries over ' + numDict(l, precision) + ':'
      for (const x in obj.entries) {
        string += '\n' + obj.entries[x].name + ':'
        for (let y = -2; y < obj.max - obj.entries[x].name.length; y++) {
          string += ' '
        }
        string += numDict(obj.entries[x].length, precision)
      }
      return string
    }
  }
}

global.stringify = function stringify(v: any, maxDepth = 3) {
  let alreadyReferencedObjects: any[] = []
  const recStringify = (value: any, depth: number): string => {
    switch (typeof value) {
      case 'undefined':
        return 'undefined'
      case 'boolean':
      case 'number':
        return value.toString()
      case 'string':
        return '"' + value.toString() + '"'
      case 'function':
        return 'function'
      case 'object':
        if (value === null) return 'null'
        else if (value instanceof RoomPosition) {
          return value.x + ',' + value.y + ',' + value.roomName
        } else if (alreadyReferencedObjects.includes(value)) return '*'
        else {
          alreadyReferencedObjects.push(value)
          if (value instanceof Array) {
            if (value.length === 0) return '[]'
            else if (depth > maxDepth) return '[ ... ]'
            else {
              let leftPad = new Array(depth).fill('  ').join('')
              let itemLeftPad = new Array(depth + 1).fill('  ').join('')
              return (
                '[<br/>' +
                value.map(item => itemLeftPad + recStringify(item, depth + 1)).join(',<br/>') +
                '<br/>' +
                leftPad +
                ']'
              )
            }
          } else {
            let props = Object.getOwnPropertyNames(value)
            if (props.length === 0) return '{}'
            else if (depth > maxDepth) return '{ ... }'
            else {
              let leftPad = new Array(depth).fill('  ').join('')
              let itemLeftPad = new Array(depth + 1).fill('  ').join('')
              return (
                '{<br/>' +
                props
                  .map(name => itemLeftPad + name + ': ' + recStringify(value[name], depth + 1))
                  .join(',<br/>') +
                '<br/>' +
                leftPad +
                '}'
              )
            }
          }
        }
      default:
        return ''
    }
  }
  return recStringify(v, 0)
}

global.roughSizeOfObject = function (object) {
  const objectList: any = []
  const stack = [object]
  let bytes = 0

  while (stack.length) {
    const value = stack.pop()

    switch (typeof value) {
      case 'boolean':
        bytes += 4
        break
      case 'string':
        bytes += value.length * 2
        break
      case 'number':
        bytes += 8
        break
      case 'object':
        if (!objectList.includes(value)) {
          objectList.push(value)
          for (const prop in value) {
            if (value.hasOwnProperty(prop)) {
              stack.push(value[prop])
            }
          }
        }
        break
    }
  }

  return bytes
}
