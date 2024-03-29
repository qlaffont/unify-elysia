/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { createPinoLogger } from '@bogeychan/elysia-logger';
import { Elysia } from 'elysia';
import {
  BadRequest,
  CustomError,
  Forbidden,
  InternalServerError,
  NotFound,
  NotImplemented,
  TimeOut,
  Unauthorized,
} from 'unify-errors';

export interface PluginUnifyElysia {
  logInstance?: ReturnType<typeof createPinoLogger> | typeof console;
  disableDetails?: boolean;
  disableLog?: boolean;
}

export const pluginUnifyElysia = (userConfig: PluginUnifyElysia = {}) => {
  const defaultConfig: Omit<Required<PluginUnifyElysia>, 'logInstance'> = {
    disableDetails: false,
    disableLog: false,
  };

  const config: PluginUnifyElysia = {
    ...defaultConfig,
    ...userConfig,
    logInstance: console,
  };

  return new Elysia({
    name: 'unify-elysia',
    seed: userConfig,
  }).onError({ as: 'global' }, ({ code, error, set }) => {
    let httpCode = 0;
    let customErrorMessage;

    const errorName =
      error.constructor.name === 'Error'
        ? error.name || 'Error'
        : error.constructor.name;

    //Try to parse the error message as JSON
    let errorMessage: Error | undefined;
    try {
      errorMessage = JSON.parse(error.message);
      // eslint-disable-next-line no-empty
    } catch (err) {}

    switch (errorName) {
      case BadRequest.name: {
        httpCode = 400;
        break;
      }
      case Unauthorized.name: {
        httpCode = 401;
        break;
      }
      case Forbidden.name: {
        httpCode = 403;
        break;
      }
      case NotFound.name: {
        httpCode = 404;
        break;
      }
      case TimeOut.name: {
        httpCode = 408;
        break;
      }
      case InternalServerError.name: {
        httpCode = 500;
        break;
      }
      case NotImplemented.name: {
        httpCode = 501;
        break;
      }
      default: {
        httpCode = 500;
        customErrorMessage = 'An unexpected error occured';
        break;
      }
    }

    if (!config?.disableLog && config.logInstance) {
      config.logInstance.error({ ...error });
    }

    const response = {
      error: customErrorMessage || errorMessage?.message || error.message,
      context: (error as CustomError).context || undefined,
      ...(config?.disableDetails
        ? {}
        : {
            stack: error.stack,
            errorDetails: errorMessage?.message || error.message,
          }),
    };

    //@ts-ignore
    if (errorMessage?.type === 'validation') {
      set.status = 400;

      return {
        error: 'Bad Request',
        //@ts-ignore
        context: error.validator.Errors(error.value).First().message,
        ...(config?.disableDetails
          ? {}
          : {
              stack: error.stack,
              //@ts-ignore
              on: errorMessage.on,
              //@ts-ignore
              expected: errorMessage.expected,
              //@ts-ignore
              errors: errorMessage.errors,
            }),
      };
    } else if (error?.message?.toLowerCase()?.includes('rate limit')) {
      set.status = 429;

      return {
        error: 'Too Many Requests',
        ...(config?.disableDetails ? {} : { stack: error.stack }),
      };
    } else {
      switch (code) {
        case 'PARSE':
        case 'INTERNAL_SERVER_ERROR':
        case 'INVALID_COOKIE_SIGNATURE':
          set.status = 500;

          return {
            ...response,
            ...(config?.disableDetails ? {} : { code }),
          };
        case 'VALIDATION':
          set.status = 400;

          return {
            ...response,
            error: 'Bad Request',
          };
        case 'NOT_FOUND':
          set.status = 404;

          return {
            error: 'Not Found',
          };
        case 'UNKNOWN':
          set.status = httpCode;

          if (errorMessage && config.logInstance) {
            config.logInstance!.error(error);
          }

          return response;
      }
    }
  });
};
