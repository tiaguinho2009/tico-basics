# Tico Basics

[![npm](https://img.shields.io/npm/v/tico-basics)](https://www.npmjs.com/package/tico-basics)
[![npm downloads](https://img.shields.io/npm/dm/tico-basics)](https://www.npmjs.com/package/tico-basics)
[![license](https://img.shields.io/npm/l/tico-basics)](https://github.com/tiaguinho2009/tico-basics/blob/main/LICENSE)

**Tico Basics** is a lightweight utility library for JavaScript and TypeScript that provides a strongly-typed event system and a modern, feature-rich console logger.

Designed with simplicity, type safety and developer experience in mind.

---

## Features

### EventSystem

- Fully typed event emitter
- Type-safe event names and arguments
- Sync and async event emission
- Listener management utilities
- Configurable debugging and safety options

### Logger

- Colored console output using `chalk`
- Optional timestamps
- Readable multi-line formatting
- Child loggers with inherited context
- Built-in performance timers
- Error formatting with stack traces
- Optional caller debugging
- Emits logger events through `EventSystem`

---

## Installation

```bash
npm install tico-basics
```

---

## Quick Example

```ts
import { EventSystem, Logger } from "tico-basics";

interface Events {
    ready: [];
    message: [string, number];
}

const logger = new Logger("Example");

const events = new EventSystem<Events>({
    debug: true,
}, logger);

logger.success("Application started");

events.on("message", (text, id) => {
    logger.info(text, id);
});

events.emit("message", "Hello World", 123);
```

---

## EventSystem

The `EventSystem` provides a lightweight, strongly-typed publish/subscribe system.

### Features

- Type-safe events
- Synchronous and asynchronous events
- One-time listeners
- Listener counting
- Automatic cleanup
- Maximum listener limits
- Optional debug logging

### Available methods

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

removeAllListeners()
setMaxListeners()
```

---

## Logger

The `Logger` provides colorful and structured console output with several quality-of-life features.

### Available log levels

```ts
logger.log(...)
logger.info(...)
logger.success(...)
logger.warn(...)
logger.error(...)
```

### Additional utilities

```ts
logger.time(...)
logger.timeLog(...)
logger.timeEnd(...)

logger.table(...)
logger.clear()

logger.child(...)
logger.test(...)
```

---

## TypeScript Support

Tico Basics is written entirely in TypeScript and exports full type definitions.

Event names and their arguments are fully inferred by the compiler, providing excellent autocomplete and compile-time safety.

---

## Build

Clone the repository and install dependencies:

```bash
npm install
```

Then build the project:

```bash
npm run build
```

---

## Contributing

Contributions are welcome!

Please read the project's contribution guidelines before opening an Issue or Pull Request.

- [Contributing Guide](./.github/CONTRIBUTING.md)
- [Code of Conduct](./.github/CODE_OF_CONDUCT.md)

---

## Security

If you discover a security vulnerability, please report it responsibly.

See the project's [Security Policy](./.github/SECURITY.md) for reporting instructions.

---

## License

Licensed under the **GNU Affero General Public License v3.0 only (AGPL-3.0-only)**.

See the [LICENSE](LICENSE) file for details.

---

## Author

**Tico ("tiaguinho2009")**

- GitHub: https://github.com/tiaguinho2009
- Email: admin@tico09.com