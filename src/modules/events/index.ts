import type Logger from "../logs/index.ts";

type EventHandler<T extends any[]> = (...args: T) => void;

type EventSystemOptions = {
	debug?: boolean;
	warnOnNoListeners?: boolean;
	catchErrors?: boolean;
	maxListeners?: number;
};

/**
 * Typed event emitter implementation.
 *
 * This class provides a strongly-typed publish/subscribe system where
 * each event name maps to a tuple of argument types. It is designed for:
 *
 * - Internal application communication
 * - Plugin systems
 * - Decoupled module interaction
 * - Predictable, type-safe event contracts
 *
 * Each event key in the generic type `E` represents an event name.
 * The corresponding value must be a tuple type describing the arguments
 * that listeners for that event will receive.
 *
 * Type Safety:
 * - `on`, `once`, `emit`, etc. are fully typed
 * - Event names are restricted to `keyof E`
 * - Listener parameters are inferred from the tuple defined in `E`
 *
 * Runtime Behavior:
 * - Listeners are stored in a `Map<event, Set<handler>>`
 * - Duplicate handlers for the same event are ignored (Set behavior)
 * - Listeners are automatically cleaned up when empty
 * - Emission can optionally catch errors
 * - Optional debug and safety warnings are available
 *
 * Not intended to be a drop-in replacement for Node.js EventEmitter.
 * Designed specifically for internal use in controlled environments.
 *
 * @template E
 * An object type where:
 * - Keys are event names (`string | symbol`)
 * - Values are tuple types representing the arguments passed to listeners
 *
 * @example
 * interface MyEvents {
 *   ready: [];
 *   message: [string, number];
 *   error: [Error];
 * }
 *
 * const events = new EventSystem<MyEvents>();
 *
 * events.on("message", (text, id) => {
 *   this.log.log(text, id);
 * });
 *
 * events.emit("message", "Hello", 123);
 *
 * // Type error:
 * // events.emit("message", 123); // ❌ wrong arguments
 *
 * @remarks
 * - Event names must match exactly the keys of `E`
 * - Argument counts and types must match the tuple definition
 * - Using `[void]` as an event signature means the listener receives one argument of type `void`
 * - Use `[]` if the event should not receive any arguments
 */
export default class EventSystem<E extends { [K in keyof E]: any[] }> {
	private listeners = new Map<keyof E, Set<EventHandler<any>>>();
	private options: Required<EventSystemOptions>;
    private log: Logger;

	/**
	 * Creates a new EventSystem instance.
	 *
	 * @param options - Optional configuration.
	 * @param options.debug - Enables debug logging.
	 * @param options.warnOnNoListeners - Warns when emitting events without listeners.
	 * @param options.catchErrors - Catches errors inside handlers to prevent crashes.
	 * @param options.maxListeners - Maximum number of listeners allowed per event.
     * @param logger - Logger instance for logging warnings and errors.
     * @remarks
     * - Default options: `{ debug: false, warnOnNoListeners: true, catchErrors: true, maxListeners: Infinity }`
	 */
	constructor(options: EventSystemOptions = {}, logger: Logger) {
		this.options = {
			debug: false,
			warnOnNoListeners: true,
			catchErrors: true,
			maxListeners: Infinity,
			...options,
		};
        this.log = logger;
	}

	/**
	 * Registers a listener for an event.
	 *
	 * @param event - The event name.
	 * @param handler - The callback function.
	 * @returns A function that removes the listener.
	 */
	on<K extends keyof E>(event: K, handler: EventHandler<E[K]>): () => void {
		let set = this.listeners.get(event);

		if (!set) {
			set = new Set();
			this.listeners.set(event, set);
		}

		if (set.size >= this.options.maxListeners) {
			this.log.warn("Max listeners exceeded for", event);
		}

		set.add(handler);
		return () => this.off(event, handler);
	}

	/**
	 * Registers a listener that executes before existing listeners.
	 *
	 * @param event - The event name.
	 * @param handler - The callback function.
	 * @returns A function that removes the listener.
	 */
	prepend<K extends keyof E>(event: K, handler: EventHandler<E[K]>): () => void {
		let set = this.listeners.get(event);

		if (!set) {
			set = new Set();
			this.listeners.set(event, set);
		}

		const newSet = new Set<EventHandler<E[K]>>([handler, ...set]);
		this.listeners.set(event, newSet as any);

		return () => this.off(event, handler);
	}

	/**
	 * Registers a listener that is executed only once.
	 *
	 * @param event - The event name.
	 * @param handler - The callback function.
	 * @returns A function that removes the listener before execution.
	 */
	once<K extends keyof E>(event: K, handler: EventHandler<E[K]>): () => void {
		const wrapper: EventHandler<E[K]> = (...args) => {
			this.off(event, wrapper);
			handler(...args);
		};

		return this.on(event, wrapper);
	}

	/**
	 * Removes a specific listener from an event.
	 *
	 * @param event - The event name.
	 * @param handler - The handler to remove.
	 */
	off<K extends keyof E>(event: K, handler: EventHandler<E[K]>): void {
		const set = this.listeners.get(event);
		if (!set) return;

		set.delete(handler);

		if (set.size === 0) {
			this.listeners.delete(event);
		}
	}

	/**
	 * Emits an event synchronously.
	 *
	 * @param event - The event name.
	 * @param args - Arguments passed to listeners.
	 * @returns `true` if listeners were executed, otherwise `false`.
	 */
	emit<K extends keyof E>(event: K, ...args: E[K]): boolean {
		const set = this.listeners.get(event);

		if (!set || set.size === 0) {
			if (this.options.warnOnNoListeners) {
				this.log.warn("Event emitted with no listeners:", event);
			}
			return false;
		}

		const { catchErrors } = this.options;

		for (const handler of set) {
			if (catchErrors) {
				try {
					handler(...args);
				} catch (err) {
					this.log.error(0, "Handler crashed for", event, err);
				}
			} else {
				handler(...args);
			}
		}

		return true;
	}

	/**
	 * Emits an event asynchronously.
	 * Waits for all listeners (supports async handlers).
	 *
	 * @param event - The event name.
	 * @param args - Arguments passed to listeners.
	 * @returns A promise resolving to `true` if listeners were executed.
	 */
	async emitAsync<K extends keyof E>(event: K, ...args: E[K]): Promise<boolean> {
		const set = this.listeners.get(event);
		if (!set || set.size === 0) return false;

		await Promise.all(
			[...set].map(async (handler) => handler(...args))
		);

		return true;
	}

	/**
	 * Returns the number of listeners attached to an event.
	 *
	 * @param event - The event name.
	 */
	listenerCount<K extends keyof E>(event: K): number {
		return this.listeners.get(event)?.size ?? 0;
	}

	/**
	 * Checks if an event has at least one listener.
	 *
	 * @param event - The event name.
	 */
	hasListeners<K extends keyof E>(event: K): boolean {
		return this.listenerCount(event) > 0;
	}

	/**
	 * Returns a list of currently registered event names.
	 */
	eventNames(): (keyof E)[] {
		return [...this.listeners.keys()];
	}

	/**
	 * Sets the maximum number of listeners allowed per event.
	 *
	 * @param n - Maximum number of listeners.
	 */
	setMaxListeners(n: number): void {
		this.options.maxListeners = n;
	}

	/**
	 * Removes all listeners.
	 *
	 * @param event - Optional event name. If omitted, removes all listeners from all events.
	 */
	removeAllListeners<K extends keyof E>(event?: K): void {
		if (event) {
			this.listeners.delete(event);
		} else {
			this.listeners.clear();
		}
	}
}