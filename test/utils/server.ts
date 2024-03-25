import { logger } from '@bogeychan/elysia-logger';
import { Elysia, error, t } from 'elysia';
import { BadRequest } from 'unify-errors';

import { PluginUnifyElysia, pluginUnifyElysia } from '../../src';

export const app = (config?: PluginUnifyElysia) =>
  new Elysia()
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
    })
    .listen(3000);

app({ logInstance: console });
