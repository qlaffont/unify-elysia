# unify-elysia

Library to have generic errors from [unify-error](https://github.com/qlaffont/unify-errors) library.

## Usage

```typescript
import { pluginUnifyElysia } from 'unify-elysia';

export const app = new Elysia()
  .use(pluginUnifyElysia({}))
```

## Plugin options

| name           | default   | description                                                     |
| -------------- | --------- | --------------------------------------------------------------- |
| logInstance    | undefined | (OPTIONAL) Pino or Console or @bogeychan/elysia-logger instance |
| disableDetails | false     | Disable error details like stack                                |
| disableLog     | false     | Disable logging on error                                        |

## Tests

To execute jest tests (all errors, type integrity test)

```
bun test
```
