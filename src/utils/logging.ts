import { debugUtils } from "debug/debugUtils"
import { customColors } from "international/constants"

export enum LogTypes {
    info,
    warning,
    error,
    debug
}

interface LogColors {
    textColor: keyof typeof customColors
    BGColor: keyof typeof customColors
    preface: string
}

const logTypeProperties = {
    [LogTypes.info]: {
        textColor: customColors.black,
        BGColor: customColors.white,
        preface: '(Info) ',
    },
    [LogTypes.warning]: {
        textColor: customColors.black,
        BGColor: customColors.yellow,
        preface: '(Warning) ',
    },
    [LogTypes.error]: {
        textColor: customColors.white,
        BGColor: customColors.red,
        preface: '(Error) ',
    },
    [LogTypes.debug]: {
        textColor: customColors.white,
        BGColor: customColors.lightBlue,
        preface: '(Debug) ',
    },
}

interface LogOpts {
    type?: LogTypes
    position?: number
}

const positionPaddingPixels = 8

export function log(title: any, message?: any, opts?: LogOpts) {

    if (!global.settings.logging) return

    if (!opts) opts = {}
    if (!global.settings.debugLogging && opts.type === LogTypes.debug) return

    const logType = opts.type ?? LogTypes.info
    const logProperties = logTypeProperties[logType]

    // Create the title

    global.logs += `<div style='width: 85vw; text-align: center; align-items: center; justify-content: left; display: flex; background: ${
        logProperties.BGColor
    }; margin-left: ${
        (opts.position ?? 0) * positionPaddingPixels
    }px;'><div style='padding: 3px; font-size: 14px; font-weigth: 400; color: ${
        logProperties.textColor
    };'>${title}:</div>`

    // Create the content

    global.logs += `<div style='box-shadow: inset rgb(0, 0, 0, 0.1) 0 0 0 10000px; padding: 3px; font-size: 14px; font-weight: 200; color: ${
        logProperties.textColor
    };'>${message ?? ''}</div></div>`
}

export function stringifyLog(title: any, message: any, opts?: LogOpts) {

    return log(title, debugUtils.stringify(message), opts)
}
