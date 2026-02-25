# tico-basics — LLM Context

## Purpose

Internal utility package providing:
- Strongly typed event system
- Structured console logger with severity levels
- Logger ↔ EventSystem integration

Designed for controlled environments (Node.js).  
Not intended as a generic EventEmitter replacement.

---

# Public API

## Root Exports

```ts
export { 
  EventSystem,
  Logger,
  type LoggerEvents,
  type LoggerOptions
}
````

---

# EventSystem<E>

## Generic Contract

```ts
class EventSystem<E extends { [K in keyof E]: any[] }>
```

* `E` maps event names → tuple of argument types
* Event names are strictly `keyof E`
* Fully type-safe `on`, `once`, `emit`, etc.

## Constructor

```ts
new EventSystem(options?: EventSystemOptions, logger: Logger)
```

### EventSystemOptions

```ts
{
  debug?: boolean
  warnOnNoListeners?: boolean
  catchErrors?: boolean
  maxListeners?: number
}
```

Defaults:

```ts
{
  debug: false,
  warnOnNoListeners: true,
  catchErrors: true,
  maxListeners: Infinity
}
```

### Important

* Requires a `Logger` instance.
* Must NOT create its own Logger (avoids recursive construction).
* Listeners stored as:

  ```ts
  Map<event, Set<handler>>
  ```

---

## Core Methods

```ts
on<K extends keyof E>(event: K, handler: (...args: E[K]) => void): () => void
once<K extends keyof E>(...)
prepend<K extends keyof E>(...)
off<K extends keyof E>(...)
emit<K extends keyof E>(event: K, ...args: E[K]): boolean
emitAsync<K extends keyof E>(...): Promise<boolean>
listenerCount<K extends keyof E>(event: K): number
hasListeners<K extends keyof E>(event: K): boolean
eventNames(): (keyof E)[]
setMaxListeners(n: number): void
removeAllListeners<K extends keyof E>(event?: K): void
```

### Runtime Behavior

* Duplicate handlers ignored (Set behavior)
* Auto-clean empty listener sets
* `emit()` is synchronous
* `emitAsync()` awaits all handlers
* Optional error catching inside handlers
* Returns `false` if no listeners executed

---

# Logger

## Constructor

```ts
new Logger(name: string, options?: LoggerOptions, parentContext?: string[])
```

### LoggerOptions

```ts
{
  clearOnInit?: boolean  // default true
  useTimestamps?: boolean // default true
}
```

## Context Model

* Context is an array of strings
* Child logger extends parent context
* Final context format:

  ```
  Parent | Child | Submodule
  ```

---

## LoggerEvents

```ts
type LoggerEvents = {
  log: [context: string[], ...args: any[]]
  info: [context: string[], ...args: any[]]
  success: [context: string[], ...args: any[]]
  warn: [context: string[], ...args: any[]]
  error: [context: string[], level: 0 | 1 | 2, ...args: any[]]
  print: [
    label: string,
    colorFn: (msg: string) => string,
    messages: any[],
    output: "log" | "info" | "warn" | "error"
  ]
}
```

---

## Public Methods

```ts
log(...messages: any[]): void
info(...messages: any[]): void
success(...messages: any[]): void
warn(...messages: any[]): void
error(level: 0 | 1 | 2, ...messages: any[]): void

clear(): void

time(label: string): void
timeLog(label: string): void
timeEnd(label: string): void

table(data: any, ...properties: string[]): void

child(name: string): Logger

test(message?: string): void
```

---

## Severity Levels

| Level | Meaning        |
| ----- | -------------- |
| 0     | ERROR          |
| 1     | CRITICAL ERROR |
| 2     | FATAL ERROR    |

---

## Internal Behavior

* Uses `chalk` for coloring
* Emits events through `this.events`
* `this.events` is:

```ts
public events = new EventSystem<LoggerEvents>(...)
```

* `warn()` prints using `console.error`
* `error()` chooses color based on severity
* `print()` builds final formatted string

---

# Design Rules

* Class-based
* No default exports except internal module structure
* EventSystem always depends on Logger
* Logger always owns an EventSystem
* Intended for Node.js console environments
* Synchronous logging
* No file output
* No async logging pipeline

---

# Usage Pattern Example

```ts
const logger = new Logger("App");

const events = new EventSystem<{
  ready: []
  message: [string]
}>({}, logger);

events.on("message", (text) => {
  logger.info("Received:", text);
});

events.emit("message", "Hello");
```

---

# Constraints for Code Generation

When generating code using this package:

* Always pass a Logger instance into EventSystem
* Do not create EventSystem without logger
* Respect tuple argument typing strictly
* Do not treat EventSystem as Node.js EventEmitter
* Do not assume async by default
* Logger methods are side-effectful (console output)
