import chalk from "chalk";

type LoggerOptions = {
    clearOnInit?: boolean;
    useTimestamps?: boolean;
}

export default class Logger {
    /**
     * 
     * @param name - App Name.
     */
    constructor(private name: string, private options: LoggerOptions = {}) {
        this.options = {
            clearOnInit: true,
            useTimestamps: true,
            ...options,
        };
        if (this.options.clearOnInit) {
            console.clear();
        }
    }

    private getTimestamp() {
        const now =new Date();
        const hours = now.getHours().toString().padStart(2, "0");
        const minutes = now.getMinutes().toString().padStart(2, "0");
        const seconds = now.getSeconds().toString().padStart(2, "0");
        return `${hours}:${minutes}:${seconds}`
    }

    private formatMessage(msg: any) {
        return typeof msg === "object" ? JSON.stringify(msg, null, 2) : msg;
    }

    /**
     * 
     * @param label - Prefix Label
     * @param colorFn - The chalk color function to apply to the prefix
     * @param messages - The messages to log
     */
    public print(label: string, colorFn: (msg: string) => string, ...messages: any[]) {
        const prefix = `[${this.getTimestamp()}] ` + `[${this.name}${label ? ` | ${label}` : ""}]`;
        messages.forEach(msg => console.log(colorFn(prefix), this.formatMessage(msg)));
    }

    public log(...messages: any[]) {
        this.print("", chalk.blue, ...messages);
    }

    public info(...messages: any[]) {
        this.print("INFO", chalk.cyan, ...messages);
    }

    public success(...messages: any[]) {
        this.print("SUCCESS", chalk.green, ...messages);
    }

    public warn(...messages: any[]) {
        this.print("WARNING", chalk.yellow, ...messages);
    }

    /**
     * 
     * @param level - 0 for ERROR, 1 for CRITICAL ERROR, 2 for FATAL ERROR
     * @param messages - The error messages to log. Can be multiple arguments.
     */
    public error(level: 0 | 1 | 2 = 0, ...messages: any[]) {
        const colorFn =
            level === 0
                ? chalk.red
                : level === 1
                ? chalk.redBright
                : chalk.bgRed;
        const label =
            level === 0 ? "ERROR" : level === 1 ? "CRITICAL ERROR" : "FATAL ERROR";

        this.print(label, colorFn, ...messages);
    }

    public clear() {
        console.clear();
    }

    public test() {
        const message = "This is a test log message.";
        this.log(message);
        this.info(message);
        this.success(message);
        this.warn(message);
        this.error(0, message);
        this.error(1, message);
        this.error(2, message);
    }
}
