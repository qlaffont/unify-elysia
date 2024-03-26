/* eslint-disable @typescript-eslint/ban-ts-comment */
import { treaty } from '@elysiajs/eden';
import { beforeAll, describe, expect, it } from 'bun:test';
import Elysia from 'elysia';

import { app } from './utils/server.test';

const testRoute = async (
  server: Elysia,
  routePath: string,
  supposedMessage: Record<string, unknown>,
  supposedStatus: number,
): Promise<unknown> => {
  let status: number;

  const JSONResponse = await server
    .handle(new Request(`http://localhost${routePath}`))
    .then((res) => {
      status = res.status;
      return res.json();
    });

  expect(JSONResponse).toMatchObject(supposedMessage);
  expect(status!).toBe(supposedStatus);

  return JSONResponse;
};

describe('Unify Elysia', () => {
  let api: ReturnType<typeof treaty<ReturnType<typeof app>>>;
  let currentApp: Elysia;

  beforeAll(() => {
    //@ts-ignore
    currentApp = app();
    //@ts-ignore
    api = treaty(currentApp);
  });

  it('should handle validation', async () => {
    // @ts-ignore
    const { error, status } = await api.validation.get({});

    expect(status).toMatchSnapshot();
    expect(JSON.stringify(error)).toMatchSnapshot();
  });

  it('should handle elysia error', async () => {
    // @ts-ignore
    const { error, status } = await api['elysia-error'].get({});

    expect(status).toMatchSnapshot();
    expect(JSON.stringify(error)).toMatchSnapshot();
  });

  it('should handle generic error', async () => {
    // @ts-ignore
    const { error, status } = await api['generic-error'].get({});

    expect(status).toMatchSnapshot();
    expect(JSON.stringify(error)).toMatchSnapshot();
  });

  it('should handle error from unify', async () => {
    // @ts-ignore
    const { error, status } = await api['unify-error'].get({});

    expect(status).toMatchSnapshot();
    expect(JSON.stringify(error)).toMatchSnapshot();
  });

  it('bad request', async () => {
    await testRoute(
      currentApp,
      '/bad-request',
      {
        error: 'Bad Request',
        context: { example: 'A bad request error' },
      },
      400,
    );
  });

  it('unauthorized', async () => {
    await testRoute(
      currentApp,
      '/unauthorized',
      {
        error: 'Unauthorized',
        context: { example: 'An unauthorized error' },
      },
      401,
    );
  });

  it('forbidden', async () => {
    await testRoute(
      currentApp,
      '/forbidden',
      {
        error: 'Forbidden',
        context: { example: 'A forbidden error' },
      },
      403,
    );
  });

  it('not-found', async () => {
    await testRoute(
      currentApp,
      '/not-found',
      {
        error: 'Not Found',
        context: { example: 'A not found error' },
      },
      404,
    );

    await testRoute(
      currentApp,
      '/not-found-url-not-registered',
      {
        error: 'Not Found',
      },
      404,
    );
  });

  it('time-out', async () => {
    await testRoute(
      currentApp,
      '/request-time-out',
      {
        error: 'Request Time-out',
        context: { example: 'A request time out error' },
      },
      408,
    );
  });

  it('internal', async () => {
    await testRoute(
      currentApp,
      '/internal',
      {
        error: 'Internal Server Error',
        context: { example: 'An internal server error' },
      },
      500,
    );
  });

  it('not-implemented', async () => {
    await testRoute(
      currentApp,
      '/not-implemented',
      {
        error: 'Not Implemented',
        context: { example: 'A not implemented error' },
      },
      501,
    );
  });

  it('rate limit', async () => {
    await testRoute(
      currentApp,
      '/rate-limit',
      {
        error: 'Too Many Requests',
      },
      429,
    );
  });

  it("error not extending 'CustomError' from 'unify-errors'", async () => {
    await testRoute(
      currentApp,
      '/not-custom',
      { error: 'An unexpected error occured' },
      500,
    );
  });

  it("default error extending 'CustomError' from 'unify-errors'", async () => {
    await testRoute(
      currentApp,
      '/default-case',
      {
        error: 'An unexpected error occured',
        context: { example: 'A CustomError but not handled' },
        errorDetails: 'A default error',
      },
      500,
    );
  });
});
