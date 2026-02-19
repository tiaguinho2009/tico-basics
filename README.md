# Tico Basics

[![npm](https://img.shields.io/npm/v/tico-basics)](https://www.npmjs.com/package/tico-basics)
[![npm downloads](https://img.shields.io/npm/dm/tico-basics)](https://www.npmjs.com/package/tico-basics)
[![license](https://img.shields.io/npm/l/tico-basics)](https://github.com/tiaguinho2009/tico-basics/blob/main/LICENSE)

**Tico Basics** is a lightweight utility package providing essential tools for **event handling** and **logging** in JavaScript/TypeScript projects.

---

## Features

* **Events Module** – Utilities to handle events easily and efficiently
* **Logs Module** – Colorful logging with `chalk` support for readable console output

---

## Installation

```bash
npm install tico-basics
```

---

## Usage

```typescript
import { EventSystem, Logger } from "tico-basics";

// Define your event types (optional, recommended for TypeScript)
interface Events {
  "test": [string, number];
}

// Create a Logger instance
const log = new Logger("MyApp");

// Create an EventSystem instance with typed events
const events = new EventSystem<Events>({
  debug: true, // enables internal debug logging
}, log);

// Logger usage
log.info("Application starting");
log.success("Application started");
log.warn("This is a warning");
log.error("This is an error");

// Measure execution time
log.time("Startup");
// ... initialization code
log.timeEnd("Startup");

// Register and emit events
events.on("test", (message, code) => {
  log.info(`Event received: ${message} (${code})`);
});

events.emit("test", "Hello World", 123);
```

---

## Build

If you want to rebuild the package from source:

```bash
npm run build
```

---

## License

This project is licensed under **AGPL-3.0-only** – see the [LICENSE](https://github.com/tiaguinho2009/tico-basics/blob/main/LICENSE) file for details.

---

## Author

**tiaguinho2009** – [GitHub](https://github.com/tiaguinho2009)