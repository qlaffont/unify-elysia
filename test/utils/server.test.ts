import { logger } from '@bogeychan/elysia-logger';
import { Elysia, error, t } from 'elysia';
import {
  BadRequest,
  CustomError,
  CustomErrorContext,
  Forbidden,
  InternalServerError,
  NotFound,
  NotImplemented,
  TimeOut,
  Unauthorized,
} from 'unify-errors';

import { PluginUnifyElysia, pluginUnifyElysia } from '../../src';

export class DefaultError extends CustomError {
  constructor(public context?: CustomErrorContext) {
    super('A default error', context);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, DefaultError.prototype);
  }
}

export const app = (config?: PluginUnifyElysia) => {
  const server = new Elysia()
    .use(
      logger({
        level: 'error',
      }),
    )
    .use(pluginUnifyElysia(config))
    .get('/validation', () => 'ok', {
      query: t.Object({
        name: t.String(),
      }),
    })
    .get('/elysia-error', () => {
      return error(401, 'Unauthorized');
    })
    .get('/generic-error', () => {
      throw 'test';
    })
    .get('/unify-error', () => {
      throw new BadRequest();
    });

  server.get('/bad-request', async () => {
    throw new BadRequest({ example: 'A bad request error' });
  });

  server.get('/unauthorized', async () => {
    throw new Unauthorized({ example: 'An unauthorized error' });
  });

  server.get('/forbidden', async () => {
    throw new Forbidden({ example: 'A forbidden error' });
  });

  server.get('/not-found', async () => {
    throw new NotFound({ example: 'A not found error' });
  });

  server.get('/request-time-out', async () => {
    throw new TimeOut({ example: 'A request time out error' });
  });

  server.get('/internal', async () => {
    throw new InternalServerError({ example: 'An internal server error' });
  });

  server.get('/not-implemented', async () => {
    throw new NotImplemented({ example: 'A not implemented error' });
  });

  server.get('/not-custom', async () => {
    throw new Error('A generic, not customized error');
  });

  server.get('/default-case', async () => {
    throw new DefaultError({ example: 'A CustomError but not handled' });
  });

  server.get('/rate-limit', async () => {
    throw new Error('rate limit');
  });

  return server;
};
