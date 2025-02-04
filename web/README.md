# 🌐 web

The web application itself. Allows users to enter an expression and view the resulting type and step-by-step type derivation. Visualises the expression's equivalent AST, highlighting relevant parts being acted upon in the step-by-step instructions. Behind the scenes, the expression is lexed and parsed by the language core, and type inference is done by one of the type inference algorithms. Initially created with [Create React App's TypeScript preset](https://create-react-app.dev/docs/getting-started/#creating-a-typescript-app), and then migrated to [Vite](https://vite.dev/). Sends analytics events to an [analytics lambda](https://github.com/domdomegg/analytics-lambda).

## Setup

Setup and build [language](../language), [algorithm-w](../algorithm-w), [algorithm-w](../algorithm-w-prime) and [algorithm-m](../algorithm-m), then run:

```
npm install
```

## Start

```
npm start
```

## Test

```
npm test
```