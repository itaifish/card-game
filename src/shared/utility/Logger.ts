import chalk from "chalk";

export enum LOG_LEVEL {
    "ANY",
    "TRACE",
    "DEBUG",
    "INFO",
    "WARN",
    "ERROR",
}

let globalLogLevel = LOG_LEVEL.DEBUG;

const setGlobalLogLevel = (level: LOG_LEVEL): void => {
    globalLogLevel = level;
};

const colorLogLevel = (logLevel: LOG_LEVEL) => {
    if (LOG_LEVEL[logLevel] == "ERROR") {
        return chalk.red(LOG_LEVEL[logLevel]);
    } else if (LOG_LEVEL[logLevel] == "WARN") {
        return chalk.hex("#FFA500")(LOG_LEVEL[logLevel]);
    }
    return chalk.white(LOG_LEVEL[logLevel]);
};

const log = (message: string, className?: string | unknown, logLevel?: LOG_LEVEL): void => {
    if ((logLevel === undefined && globalLogLevel != LOG_LEVEL.ANY) || logLevel < globalLogLevel) {
        return;
    }
    let name = chalk.blue(className || "LOGGER");
    if (typeof className != "string" && className?.constructor) {
        name = chalk.blue(className.constructor.name);
    }
    const error = new Error().stack?.split("\n");
    const previousStack = error[2] ? `\n${chalk.cyan(error[2])}` : "";
    const coloredLog = logLevel ? colorLogLevel(logLevel) : colorLogLevel(LOG_LEVEL["ANY"]);
    const output = `${name}.${coloredLog} [${new Date().toLocaleTimeString()}]: ${message}${previousStack}`;
    console.log(output);
};

export default log;
