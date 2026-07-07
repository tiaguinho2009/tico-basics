import chalk from "chalk";
import { inspect } from "node:util";
import EventSystem from "../events/index.js";

export type LoggerEvents = {
    log: [parentContext: string[], ...args: any[]];
    info: [parentContext: string[], ...args: any[]];
    success: [parentContext: string[], ...args: any[]];
    warn: [parentContext: string[], ...args: any[]];
    error: [parentContext: string[], level: 0 | 1 | 2, ...args: any[]];
    print: [label: string, colorFn: (msg: string) => string, messages: unknown[], output: "log" | "info" | "warn" | "error"];
}

/**
 * Configuration options for the {@link Logger}.
 */
export type LoggerOptions = {
    clearOnInit?: boolean;
    useTimestamps?: boolean;

    /**
     * Displays multiple messages using tree formatting.
     * @default true
     */
    formatMultipleMessages?: boolean;

    /**
     * Shows the type before non-string values.
     * @default false
     */
    showTypes?: boolean;

    /**
     * Shows where the logger call originated from.
     * @default false
     */
    debug?: boolean;

    /**
     * Detects promises passed directly to the logger.
     * @default true
     */
    detectPromises?: boolean;

    /**
     * Warns when source maps may not be enabled.
     * @default true
     */
    sourceMapWarning?: boolean;
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
            formatMultipleMessages: true,
            showTypes: false,
            debug: false,
            detectPromises: true,
            sourceMapWarning: true,
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
     * Formats an {@link Error} into a readable string.
     *
     * Includes the error name, message, stack trace and recursively
     * formats the {@link Error.cause | cause}, if present.
     *
     * @param error - The error to format.
     * @returns A formatted error string.
     */
    private formatError(error: Error): string {
        let output = "";

        output += `${chalk.red(error.name)}: ${error.message}`;

        if (error.stack) {
            const stack = error.stack
                .split("\n")
                .slice(1)
                .map(line => chalk.gray(line))
                .join("\n");

            output += "\n" + stack;
        }


        if (error.cause) {
            output += "\n\n" + chalk.yellow("Caused by:");

            output += "\n" + this.formatMessage(error.cause);
        }

        return output;
    }

    /**
     * Determines whether a value is Promise-like.
     *
     * Used to detect accidentally logged promises,
     * which usually indicates a missing `await`.
     *
     * @param value - The value to test.
     * @returns `true` if the value is Promise-like, otherwise `false`.
     */
    private isPromise(value: unknown): boolean {
        return (
            typeof value === "object" &&
            value !== null &&
            typeof (value as Promise<unknown>).then === "function"
        );
    }

    /**
     * Formats a value into a human-readable string.
     *
     * Handles {@link Error} objects, Promise detection and
     * optional type prefixes before delegating formatting
     * to {@link inspect}.
     *
     * @param msg - The value to format.
     * @returns The formatted string representation.
     */
    private formatMessage(msg: unknown): string {
        if (msg instanceof Error) {
            return this.formatError(msg);
        }

        if (this.options.detectPromises && this.isPromise(msg)) {
            return chalk.yellow(
                "[Promise detected] Did you forget to await?"
            );
        }

        const type = this.options.showTypes
            ? chalk.gray(`[${typeof msg}] `)
            : "";

        return type + inspect(msg, {
            depth: Infinity,
            colors: false,
            compact: false,
        });
    }

    private warnedAboutSourceMaps = false;

    private checkSourceMaps(stack?: string): void {
        if (this.warnedAboutSourceMaps || !stack) return;

        const looksCompiled = stack.includes(".js");
        const hasTypescript = stack.includes(".ts") === false;

        if (!looksCompiled || !hasTypescript) return;

        this.warnedAboutSourceMaps = true;

        this.warn(
            [
                "Source maps may not be enabled.",
                "Your application appears to be running compiled JavaScript.",
                "For better stack traces run Node with:",
                "",
                "  node --enable-source-maps ...",
                "",
                "If this is a false alarm, disable this warning with:",
                "",
                "  Logger({ sourceMapWarning: false })",
            ].join("\n")
        );
    }

    /**
     * Attempts to determine the location where the logger
     * was called from by inspecting the current stack trace.
     *
     * Internal logger frames and dependencies are ignored.
     *
     * @returns The caller stack frame, or `undefined`
     * if it cannot be determined.
     */
    private getCaller(): string | undefined {
        const stack = new Error().stack;

        if (this.options.sourceMapWarning) this.checkSourceMaps(stack);
        
        if (!stack) return;

        const lines = stack.split("\n").slice(1);

        for (const line of lines) {
            if (
                line.includes("/logs/") ||
                line.includes("\\logs\\") ||
                line.includes("Logger.") ||
                line.includes("node_modules")
            ) {
                continue;
            }

            return line.trim();
        }
    }

    /**
     * Prints a formatted log message.
     *
     * Handles timestamps, context prefixes, optional caller
     * information, multi-message formatting and dispatches
     * the final output to the appropriate console method.
     *
     * If an internal logger error occurs, it falls back to
     * `console.error()` to avoid hiding the original problem.
     *
     * @param label - Prefix label (e.g. INFO, ERROR).
     * @param colorFn - Chalk color function applied to the output.
     * @param messages - One or more values to log.
     * @param output - Console output method to use.
     */
    public print(
        label: string,
        colorFn: (msg: string) => string,
        messages: unknown[],
        output: "log" | "info" | "warn" | "error" = "log"
    ): void {
        try {
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

            if (this.options.debug) {
                const caller = this.getCaller();

                if (caller) {
                    finalOutput += "\n" + chalk.gray(`↳ ${caller}`);
                }
            }

            if (messages.length > 1 && this.options.formatMultipleMessages) {
                messages.forEach((msg, index) => {
                    const last = index === messages.length - 1;

                    finalOutput += "\n";
                    finalOutput += last ? "└─ " : "├─ ";
                    finalOutput += this.formatMessage(msg);
                });
            } else if (messages.length > 1) {
                messages.forEach(msg => {
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
        } catch (err) {
            console.error("Logger internal error:", err);
        }
    }

    /**
     * Logs a standard message in blue.
     *
     * @param messages - Messages to log.
     */
    public log(...messages: unknown[]): void {
        this.print("", chalk.blue, messages);
        this.events.emit("log", this.context, ...messages);
    }

    /**
     * Logs an informational message in cyan.
     *
     * @param messages - Messages to log.
     */
    public info(...messages: unknown[]): void {
        this.print("INFO", chalk.cyan, messages);
        this.events.emit("info", this.context, ...messages);
    }

    /**
     * Logs a success message in green.
     *
     * @param messages - Messages to log.
     */
    public success(...messages: unknown[]): void {
        this.print("SUCCESS", chalk.green, messages);
        this.events.emit("success", this.context, ...messages);
    }

    /**
     * Logs a warning message in yellow.
     *
     * @param messages - Messages to log.
     */
    public warn(...messages: unknown[]): void {
        this.print("WARNING", chalk.yellow, messages, "warn");
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
    public error(level: 0 | 1 | 2 = 0, ...messages: unknown[]): void {
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

    /**
     * Starts a named performance timer.
     *
     * @param label - Unique timer identifier.
     */
    public time(label: string): void {
        this.timers.set(label, performance.now());
        this.print("TIMER START", chalk.magenta, [`${label} started`]);
    }

    /**
     * Logs the current elapsed time of a running timer
     * without stopping it.
     *
     * @param label - Timer identifier.
     */
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

    /**
     * Stops a running timer and logs its total duration.
     *
     * @param label - Timer identifier.
     */
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

    /**
     * Displays data in a tabular format.
     *
     * This is intended for arrays of objects or plain objects
     * where a table representation improves readability.
     *
     * @param data - The data to display.
     * @param properties - Optional property names to include.
     */
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
     * Creates a child {@link Logger} that inherits this logger's configuration
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
