export enum LOG_LEVEL {
    "TRACE",
    "DEBUG",
    "INFO",
    "WARN",
    "ERROR",
}

const log = (message: string, className?: string | any, logLevel?: LOG_LEVEL): void => {
    let name = className;
    if (typeof className != "string" && className?.constructor) {
        name = className.constructor.name;
    }
    const error = new Error().stack?.split("\n");
    const previousStack = error[2] ? `\n${error[2]}` : "";
    const output = `${name || "LOGGER"}.${
        LOG_LEVEL[logLevel] || "ANY"
    } [${new Date().toLocaleTimeString()}]: ${message}${previousStack}`;
    console.log(output);
};

export default log;
