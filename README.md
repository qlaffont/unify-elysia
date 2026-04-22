# unify-elysia

Elysia adapter for [`unify-errors`](https://github.com/qlaffont/unify-errors).
It maps shared error classes to HTTP status codes and serializes responses with
the unified payload shape.

## Usage

```typescript
import Elysia from 'elysia';
import { pluginUnifyElysia } from 'unify-elysia';
import { BadRequest } from 'unify-errors';

export const app = new Elysia()
  .use(pluginUnifyElysia({}))
  .get('/payments/:id', ({ params }) => {
    throw new BadRequest('PAYMENT_INVALID', {
      message: 'Payment id is invalid',
      details: [`Received: ${params.id}`],
      localizedMessage: 'Invalid payment identifier',
    });
  });
```

## Plugin options

| name | default | description |
| --- | --- | --- |
| `logInstance` | `undefined` | Optional Pino, Console, or `@bogeychan/elysia-logger` instance |
| `disableDetails` | `false` | Strip `details` from serialized responses |
| `disableLog` | `false` | Disable logging on handled errors |

## Response shape

When a `CustomError` reaches the plugin, the response body is normalized to:

```typescript
{
  code?: string;
  message?: string;
  details: string[];
  localizedMessage?: string;
}
```

The plugin keeps HTTP status mapping inside the adapter:

- `BadRequest` -> `400`
- `Unauthorized` -> `401`
- `Forbidden` -> `403`
- `NotFound` -> `404`
- `Conflict` -> `409`
- `TimeOut` -> `408`
- `TooManyRequests` -> `429`
- `InternalServerError` -> `500`
- `NotImplemented` -> `501`
- `ServiceUnavailable` -> `503`

Framework fallbacks such as parse errors, validation errors, unknown routes,
and rate-limit messages are also normalized to the same payload shape.

## Details handling

`disableDetails: true` behaves like Kotlin `includeDetails = false`:

- `code` and `message` are still returned
- `details` becomes an empty array

## Tests

```bash
bun test
```
