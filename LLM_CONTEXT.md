# tico-basics — LLM Context

## Purpose

Tico Basics is a lightweight utility library for Node.js providing:

- A strongly typed event system (`EventSystem`)
- A structured console logger (`Logger`)
- Tight Logger ↔ EventSystem integration

The library prioritizes:

- Type safety
- Minimal dependencies
- Predictable runtime behavior
- Developer experience

It is **not** intended as a replacement for Node.js `EventEmitter`.

---

# Public API

```ts
import {
    EventSystem,
    Logger,
    type LoggerEvents,
    type LoggerOptions,
} from "tico-basics";
```

---

# EventSystem

## Generic Contract

```ts
class EventSystem<E extends { [K in keyof E]: any[] }>
```

Each key represents an event name.

Each value is the tuple of arguments that listeners receive.

Example:

```ts
interface Events {
    ready: [];
    message: [string];
    error: [Error];
}
```

---

## Constructor

```ts
new EventSystem(
    options?: EventSystemOptions,
    logger: Logger
)
```

A `Logger` instance is **required**.

Never construct an internal Logger inside EventSystem.

---

## EventSystemOptions

```ts
{
    debug?: boolean;
    warnOnNoListeners?: boolean;
    catchErrors?: boolean;
    maxListeners?: number;
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

---

## Public Methods

```ts
on()
once()
prepend()
off()

emit()
emitAsync()

listenerCount()
hasListeners()
eventNames()

setMaxListeners()
removeAllListeners()
```

---

## Runtime Behavior

- Listener storage:

```ts
Map<event, Set<handler>>
```

- Duplicate listeners ignored.
- Empty listener sets removed automatically.
- `emit()` is synchronous.
- `emitAsync()` awaits every listener.
- Optional exception catching.
- Emits return `false` when no listeners exist.

---

# Logger

## Constructor

```ts
new Logger(
    name: string,
    options?: LoggerOptions,
    parentContext?: string[]
)
```

---

## LoggerOptions

```ts
{
    clearOnInit?: boolean;
    useTimestamps?: boolean;

    formatMultipleMessages?: boolean;

    showTypes?: boolean;

    debug?: boolean;

    detectPromises?: boolean;

    sourceMapWarning?: boolean;
}
```

Defaults:

```ts
{
    clearOnInit: true,
    useTimestamps: true,
    formatMultipleMessages: true,
    showTypes: false,
    debug: false,
    detectPromises: true,
    sourceMapWarning: true
}
```

---

## Context Model

Logger context is hierarchical.

Example:

```text
App
App | Database
App | Database | SQLite
```

Child loggers inherit every option from their parent.

---

## Logger Events

```ts
type LoggerEvents = {
    log: [context: string[], ...args: any[]];
    info: [context: string[], ...args: any[]];
    success: [context: string[], ...args: any[]];
    warn: [context: string[], ...args: any[]];
    error: [context: string[], level: 0 | 1 | 2, ...args: any[]];
    print: [
        label: string,
        colorFn: (msg: string) => string,
        messages: unknown[],
        output: "log" | "info" | "warn" | "error"
    ];
}
```

The Logger exposes:

```ts
logger.events
```

which is a fully typed `EventSystem<LoggerEvents>`.

---

## Public Methods

### Logging

```ts
log()

info()

success()

warn()

error()
```

### Timers

```ts
time()

timeLog()

timeEnd()
```

### Utilities

```ts
clear()

table()

child()

test()
```

---

## Error Levels

| Level | Label |
|-------:|-------|
| 0 | ERROR |
| 1 | CRITICAL ERROR |
| 2 | FATAL ERROR |

---

## Internal Behavior

Logger internally:

- Uses `chalk` for coloring.
- Formats `Error` objects recursively.
- Supports `Error.cause`.
- Detects accidentally logged Promises.
- Can display runtime caller locations.
- Warns when Node source maps appear disabled.
- Formats multiple messages as a tree.
- Emits logger events through `logger.events`.

All public logging methods ultimately delegate to:

```ts
print(...)
```

---

# Design Principles

- Type-safe API
- Lightweight
- Class-based
- Predictable runtime behavior
- No file logging
- Console-oriented
- No asynchronous logging pipeline
- No external transports

---

# Usage Example

```ts
const logger = new Logger("App");

const events = new EventSystem<{
    ready: [];
    message: [string];
}>({}, logger);

events.on("message", text => {
    logger.info(text);
});

events.emit("message", "Hello");
```

---

# Code Generation Rules

When generating code using Tico Basics:

- Always provide a `Logger` when constructing an `EventSystem`.
- Never create an `EventSystem` without a logger.
- Respect tuple typing exactly.
- Do not treat EventSystem as Node.js EventEmitter.
- Prefer typed event interfaces.
- Logger methods perform console output immediately.
- Use child loggers instead of manually concatenating contexts.
- Prefer `emitAsync()` only when listeners are expected to return Promises.