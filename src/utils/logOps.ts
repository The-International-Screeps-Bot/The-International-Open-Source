import { DebugUtils } from 'debug/debugUtils'
import { CollectiveManager } from 'international/collective'
const customColors = {
  white: '#ffffff',
  lightGrey: '#eaeaea',
  midGrey: '#bcbcbc',
  darkGrey: '#5e5e5e',
  lightBlue: '#0f66fc',
  darkBlue: '#02007d',
  black: '#000000',
  yellow: '#f5cf95',
  lightYellow: '#f7f7b4',
  red: '#d10000',
  green: '#00d137',
  brown: '#aa7253',
  purple: '#8b06a3',
  pink: '#d60ef9',
  orange: '#f27602',
  teal: '#02f2e2',
}

export enum LogTypes {
  info,
  warning,
  error,
  debug,
}

const logTypeProperties = {
  [LogTypes.info]: {
    textColor: customColors.black,
    BGColor: customColors.white,
    preface: '(Info)   ',
  },
  [LogTypes.warning]: {
    textColor: customColors.black,
    BGColor: customColors.lightYellow,
    preface: '(Warning)',
  },
  [LogTypes.error]: {
    textColor: customColors.white,
    BGColor: customColors.red,
    preface: '  (Error)',
  },
  [LogTypes.debug]: {
    textColor: customColors.white,
    BGColor: customColors.lightBlue,
    preface: '  (Debug)',
  },
}

interface LogOpts {
  type?: LogTypes
  position?: number
  BGColor?: string
  textColor?: string
}

const positionPaddingPixels = 8

/* export function LogOps.LogOpstitle: any, message?: any, opts?: LogOpts) {
  if (!global.settings.logging) return

  if (!opts) opts = {}
  if (!global.settings.debugLogging && opts.type === LogTypes.debug) return

  const logType = opts.type ?? LogTypes.info
  const logProperties = logTypeProperties[logType]

  const BGColor = opts.BGColor ?? logProperties.BGColor
  const textColor = opts.textColor ?? logProperties.textColor

  // Create the title
  CollectiveManager.logs += `<div class='log' style='width: 100vw; text-align: center; align-items: center; justify-content: left; display: flex; background: ${BGColor}; margin-left: ${
    (opts.position ?? 0) * positionPaddingPixels
  }px;'><div style='padding: 3px; font-size: 14px; font-weight: 600; color: ${textColor};'>${
    logProperties.preface
  } ${title}:</div>`

  CollectiveManager.logs += `<div style='background-color: rgb(0, 0, 0, 0.15); border-radius:5px; padding: 1px 10px 1px 10px; font-size: 14px; font-weight: 200; color: ${textColor};'>${
    message ?? ''
  }</div></div>`
} */

export class LogOps {
  static log(title: any, message?: any, opts?: LogOpts) {
    if (!global.settings.logging) return

    if (!opts) opts = {}
    if (!global.settings.debugLogging && opts.type === LogTypes.debug) return

    const logType = opts.type ?? LogTypes.info
    const logProperties = logTypeProperties[logType]

    const BGColor = opts.BGColor ?? logProperties.BGColor
    const textColor = opts.textColor ?? logProperties.textColor

    // Create the title
    CollectiveManager.logs += `<div class='log' style='width: 100vw; text-align: center; align-items: center; justify-content: left; display: flex; background: ${BGColor}; margin-left: ${
      (opts.position ?? 0) * positionPaddingPixels
    }px;'><div style='padding: 3px; font-size: 14px; font-weight: 600; color: ${textColor};'>${
      logProperties.preface
    } ${title}:</div>`

    CollectiveManager.logs += `<div style='background-color: rgb(0, 0, 0, 0.15); border-radius:5px; padding: 1px 10px 1px 10px; font-size: 14px; font-weight: 200; color: ${textColor};'>${
      message ?? ''
    }</div></div>`
/*     CollectiveManager.logs += `<div class='consolePrefaceParent' style='background: ${BGColor}; margin-left: ${
      (opts.position ?? 0) * positionPaddingPixels
    }px;'><div class='consolePrefaceChild' style='color: ${textColor};'>${
      logProperties.preface
    } ${title}:</div>`

    CollectiveManager.logs += `<div class='consoleMessage' style='color: ${textColor};'>${
      message ?? ''
    }</div></div>` */
  }

  static stringifyLog(title: any, message: any, opts?: LogOpts) {
    return this.log(title, DebugUtils.stringify(message), opts)
  }

  static registerStyles() {
    const stylesID = 'styles'
    const css = `
    .consolePrefaceParent {
      width: 100vw;
      text-align: center;
      align-items: center;
      justify-content: left;
      display: flex;
    }
    .consolePrefaceChild {
      padding: 3px;
      font-size: 14px;
      font-weight: 600;
    }
    .consoleMessage {
      background-color: rgb(0, 0, 0, 0.15);
      border-radius:5px;
      padding: 1px 10px 1px 10px;
      font-size: 14px;
      font-weight: 200;
    }`

    console.log(
      `<script>` +
        `var node = document.getElementById("${stylesID}");` +
        `if (node === null) {` +
        `let style = document.createElement("style");` +
        `style.id = "${stylesID}";` +
        `document.body.appendChild(style);` +
        `}` +
        'document.getElementById("${stylesID}").innerHTML = `' + css + '`;' +
        `</script>`,
    )
  }
}
