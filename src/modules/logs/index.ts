import chalk from "chalk";
import EventSystem from "../events/index.js";

export type LoggerEvents = {
    log: [parentContext: string[], ...args: any[]];
    info: [parentContext: string[], ...args: any[]];
    success: [parentContext: string[], ...args: any[]];
    warn: [parentContext: string[], ...args: any[]];
    error: [parentContext: string[], level: 0 | 1 | 2, ...args: any[]];
    print: [label: string, colorFn: (msg: string) => string, messages: any[], output: "log" | "info" | "warn" | "error"];
}

/**
 * Configuration options for the {@link Logger}.
 */
export type LoggerOptions = {
    /**
     * Clears the console when the logger is initialized.
     * @default true
     */
    clearOnInit?: boolean;

    /**
     * Enables timestamps in log messages.
     * @default true
     */
    useTimestamps?: boolean;
};

/**
 * A simple colored console logger with timestamp and severity support.
 *
 * @example
 * ```ts
 * const logger = new Logger("MyApp");
 * logger.info("Application started");
 * logger.success("Connected successfully");
 * logger.error(1, "Something went wrong");
 * ```
 */
export default class Logger {
    private context: string[];
    private options: LoggerOptions;
    private timers = new Map<string, number>();
    private groupLevel = 0;

    public events = new EventSystem<LoggerEvents>({
        debug: false,
        warnOnNoListeners: false,
        catchErrors: false
    }, this) as EventSystem<LoggerEvents>;

    /**
     * Creates a new Logger instance.
     *
     * @param name - The application or module context used as log prefix.
     * @param options - Optional logger configuration.
     * @param parentContext - Parent logger context for child loggers.
     */
    constructor(name: string, options: LoggerOptions = {}, parentContext?: string[]) {
        this.options = {
            clearOnInit: true,
            useTimestamps: true,
            ...options,
        };

        this.context = parentContext
            ? [...parentContext, name]
            : [name];

        if (!parentContext && this.options.clearOnInit) {
            console.clear();
        }
    }

    /**
     * Generates a formatted timestamp in HH:mm:ss format.
     *
     * @returns The current time formatted as a string.
     */
    private getTimestamp(): string {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, "0");
        const minutes = now.getMinutes().toString().padStart(2, "0");
        const seconds = now.getSeconds().toString().padStart(2, "0");
        return `${hours}:${minutes}:${seconds}`;
    }

    /**
     * Formats a message for logging.
     * Objects are stringified with indentation.
     *
     * @param msg - The message to format.
     * @returns The formatted message.
     */
    private formatMessage(msg: unknown): string {
        return typeof msg === "object"
            ? JSON.stringify(msg, null, 2)
            : String(msg);
    }

    /**
     * Prints a formatted log message with a custom label and color.
     *
     * @param label - Prefix label (e.g., INFO, ERROR).
     * @param colorFn - Chalk color function applied to the prefix.
     * @param messages - One or more messages to log.
     */
    public print(
        label: string,
        colorFn: (msg: string) => string,
        messages: any[],
        output: "log" | "info" | "warn" | "error" = "log"
    ): void {
        if (messages.length === 0) {
            this.warn(["Logger.print called without messages"]);
            return;
        }

        const timestamp = this.options.useTimestamps
            ? `[${this.getTimestamp()}] `
            : "";

        const contextString = this.context.join(" | ");

        const indent = "  ".repeat(this.groupLevel);
        const prefix = `${timestamp}[${contextString}${label ? ` | ${label}` : ""}]`;

        let finalOutput = indent + prefix;

        if (messages.length > 1) {
            messages.forEach((msg) => {
                finalOutput += "\n" + this.formatMessage(msg);
            });
        } else if (messages.length === 1) {
            finalOutput += " " + this.formatMessage(messages[0]);
        }

        if (output === "log") {
            console.log(colorFn(finalOutput));
        }
        if (output === "info") {
            console.info(colorFn(finalOutput));
        }
        if (output === "warn") {
            console.warn(colorFn(finalOutput));
        }
        if (output === "error") {
            console.error(colorFn(finalOutput));
        }

        this.events.emit("print", label, colorFn, messages, output);
    }

    /**
     * Logs a standard message in blue.
     *
     * @param messages - Messages to log.
     */
    public log(...messages: any[]): void {
        this.print("", chalk.blue, messages);
        this.events.emit("log", this.context, ...messages);
    }

    /**
     * Logs an informational message in cyan.
     *
     * @param messages - Messages to log.
     */
    public info(...messages: any[]): void {
        this.print("INFO", chalk.cyan, messages);
        this.events.emit("info", this.context, ...messages);
    }

    /**
     * Logs a success message in green.
     *
     * @param messages - Messages to log.
     */
    public success(...messages: any[]): void {
        this.print("SUCCESS", chalk.green, messages);
        this.events.emit("success", this.context, ...messages);
    }

    /**
     * Logs a warning message in yellow.
     *
     * @param messages - Messages to log.
     */
    public warn(...messages: any[]): void {
        this.print("WARNING", chalk.yellow, messages, "error");
        this.events.emit("warn", this.context, ...messages);
    }

    /**
     * Logs an error message with severity levels.
     *
     * @param level - Error severity level:
     * - `0` → ERROR
     * - `1` → CRITICAL ERROR
     * - `2` → FATAL ERRORlevel
     *
     * @param messages - One or more error messages.
     */
    public error(level: 0 | 1 | 2 = 0, ...messages: any[]): void {
        const colorFn =
            level === 0
                ? chalk.red
                : level === 1
                ? chalk.redBright
                : chalk.bgRed;

        const label =
            level === 0
                ? "ERROR"
                : level === 1
                ? "CRITICAL ERROR"
                : "FATAL ERROR";

        this.print(label, colorFn, messages, "error");
        this.events.emit("error", this.context, level, ...messages);
    }

    /**
     * Clears the console.
     */
    public clear(): void {
        console.clear();
    }

    public time(label: string): void {
        this.timers.set(label, performance.now());
        this.print("TIMER START", chalk.magenta, [`${label} started`]);
    }

    public timeLog(label: string): void {
        const start = this.timers.get(label);
        if (!start) {
            this.warn(`Timer "${label}" does not exist.`);
            return;
        }

        const duration = performance.now() - start;
        this.print("TIMER", chalk.magentaBright, [
            `${label}: ${duration.toFixed(2)}ms`
        ]);
    }

    public timeEnd(label: string): void {
        const start = this.timers.get(label);
        if (!start) {
            this.warn(`Timer "${label}" does not exist.`);
            return;
        }

        const duration = performance.now() - start;
        this.timers.delete(label);

        this.print("TIMER END", chalk.magenta, [
            `${label}: ${duration.toFixed(2)}ms`
        ]);
    }

    public table(data: any, ...properties: string[]): void {
        if (!data) {
            this.warn("No data provided to table()");
            return;
        }

        const formatted =
            typeof data === "object"
                ? JSON.stringify(data, null, 2)
                : String(data);

        this.print("TABLE", chalk.white, [formatted]);
    }

    /**
     * Creates a child logger that inherits this logger's configuration
     * and extends its context.
     *
     * @param name - Child context name.
     * @returns A new Logger instance.
     */
    public child(name: string): Logger {
        return new Logger(
            name,
            {
                ...this.options,
                clearOnInit: false,
            },
            this.context
        );
    }

    /**
     * Runs a demonstration of all log levels.
     * Useful for testing color output and formatting.
     * @param message - Optional custom message to display in the test logs.
     */
    public test(message: string = "This is a test log message."): void {
        this.log(message);
        this.info(message);
        this.success(message);
        this.warn(message);
        this.error(0, message);
        this.error(1, message);
        this.error(2, message);
    }
}
