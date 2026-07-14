# Contributing to Tico Basics

First of all, thank you for considering contributing to Tico Basics!

The goal of this project is to provide lightweight, reliable, and well-typed utilities for JavaScript and TypeScript applications. Every contribution should help keep the library simple, predictable, and easy to maintain.

## Before You Start

- Check whether a similar issue or pull request already exists.
- If you're planning a large feature or breaking change, please open an issue first to discuss it.
- Keep pull requests focused on a single change whenever possible.

## Development Setup

Clone the repository:

```bash
git clone https://github.com/tiaguinho2009/tico-basics.git
cd tico-basics
```

Install dependencies:

```bash
npm install
```

Build the project:

```bash
npm run build
```

## Coding Guidelines

Please follow these principles:

- Write clean and readable code.
- Prefer TypeScript features over JavaScript workarounds.
- Keep the library lightweight.
- Avoid unnecessary dependencies.
- Keep the public API as small and intuitive as possible.
- Maintain backwards compatibility whenever reasonable.

### Formatting

Before opening a Pull Request, make sure the project builds successfully and your code is formatted according to the project's formatting rules.

## Commit Messages

Write clear and descriptive commit messages.

Examples:

```txt
feat: add once listener support
fix: prevent logger from printing duplicate timestamps
refactor: simplify EventSystem internals
docs: improve Logger examples
```

## Pull Requests

A good Pull Request should:

- have a clear title
- explain the reason for the change
- include documentation when necessary
- keep unrelated changes out of the PR

Please make sure:

- the project builds successfully
- existing functionality is not broken
- documentation is updated when required

## Reporting Bugs

When reporting a bug, include:

- Node.js version
- package version
- operating system
- reproduction steps
- expected behavior
- actual behavior

Providing a minimal reproduction is greatly appreciated.

## Suggesting Features

Feature requests are welcome.

When suggesting one, explain:

- the problem you're trying to solve
- your proposed solution
- possible alternatives

Please keep in mind that Tico Basics aims to remain lightweight. Not every feature request will fit the project's goals.

## Questions

If you're unsure about something, feel free to open an issue before starting work.

Thank you for helping improve Tico Basics ❤️
