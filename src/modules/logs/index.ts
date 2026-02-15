import chalk from "chalk";

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
    /**
     * Creates a new Logger instance.
     *
     * @param name - The application or module name used as log prefix.
     * @param options - Optional logger configuration.
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
        ...messages: unknown[]
    ): void {
        const timestamp = this.options.useTimestamps
            ? `[${this.getTimestamp()}] `
            : "";

        const prefix =
            `${timestamp}[${this.name}${label ? ` | ${label}` : ""}]`;

        messages.forEach((msg) =>
            console.log(colorFn(prefix), this.formatMessage(msg))
        );
    }

    /**
     * Logs a standard message in blue.
     *
     * @param messages - Messages to log.
     */
    public log(...messages: unknown[]): void {
        this.print("", chalk.blue, ...messages);
    }

    /**
     * Logs an informational message in cyan.
     *
     * @param messages - Messages to log.
     */
    public info(...messages: unknown[]): void {
        this.print("INFO", chalk.cyan, ...messages);
    }

    /**
     * Logs a success message in green.
     *
     * @param messages - Messages to log.
     */
    public success(...messages: unknown[]): void {
        this.print("SUCCESS", chalk.green, ...messages);
    }

    /**
     * Logs a warning message in yellow.
     *
     * @param messages - Messages to log.
     */
    public warn(...messages: unknown[]): void {
        this.print("WARNING", chalk.yellow, ...messages);
    }

    /**
     * Logs an error message with severity levels.
     *
     * @param level - Error severity level:
     * - `0` → ERROR
     * - `1` → CRITICAL ERROR
     * - `2` → FATAL ERROR
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

        this.print(label, colorFn, ...messages);
    }

    /**
     * Clears the console.
     */
    public clear(): void {
        console.clear();
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
