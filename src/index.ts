import type { createPinoLogger } from "@bogeychan/elysia-logger";
import { Elysia, ElysiaCustomStatusResponse } from "elysia";
import {
  BadRequest,
  Conflict,
  CustomError,
  type ErrorResponse,
  Forbidden,
  InternalServerError,
  NotFound,
  NotImplemented,
  ServiceUnavailable,
  TimeOut,
  TooManyRequests,
  Unauthorized,
  isCustomError,
} from "unify-errors";

export interface PluginUnifyElysia {
  logInstance?: ReturnType<typeof createPinoLogger> | typeof console;
  disableDetails?: boolean;
  disableLog?: boolean;
}

const DEFAULT_ERROR_MESSAGE = "An unexpected error occured";

const buildResponse = (
  values: Omit<ErrorResponse, "details"> & { details?: string[] },
  includeDetails: boolean,
): ErrorResponse => ({
  code: values.code,
  message: values.message,
  details: includeDetails ? (values.details ?? []) : [],
  localizedMessage: values.localizedMessage,
});

const resolveStatusCode = (error: CustomError): number => {
  if (error instanceof BadRequest) return 400;
  if (error instanceof Unauthorized) return 401;
  if (error instanceof Forbidden) return 403;
  if (error instanceof NotFound) return 404;
  if (error instanceof Conflict) return 409;
  if (error instanceof TimeOut) return 408;
  if (error instanceof TooManyRequests) return 429;
  if (error instanceof InternalServerError) return 500;
  if (error instanceof NotImplemented) return 501;
  if (error instanceof ServiceUnavailable) return 503;

  return 500;
};

const normalizeThrownError = (rawError: unknown): Error => {
  if (rawError instanceof Error) return rawError;
  if (typeof rawError === "string") return new Error(rawError);

  return new Error(DEFAULT_ERROR_MESSAGE);
};

const parseErrorMessage = (message: string): Record<string, unknown> | undefined => {
  try {
    const parsed = JSON.parse(message) as unknown;
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
};

const getValidationDetail = (error: Error): string | undefined => {
  const validationError = error as Error & {
    validator?: {
      Errors?: (value: unknown) => { First?: () => { message?: string } };
    };
    value?: unknown;
  };

  return validationError.validator?.Errors?.(validationError.value)?.First?.()?.message;
};

export const pluginUnifyElysia = (userConfig: PluginUnifyElysia = {}) => {
  const defaultConfig: Omit<Required<PluginUnifyElysia>, "logInstance"> = {
    disableDetails: false,
    disableLog: false,
  };

  const config: PluginUnifyElysia = {
    ...defaultConfig,
    ...userConfig,
  };

  return new Elysia({
    name: "unify-elysia",
    seed: userConfig,
  }).onError({ as: "global" }, ({ code, error: rawError, set }) => {
    if (rawError instanceof ElysiaCustomStatusResponse) return;
    const error = normalizeThrownError(rawError);
    const includeDetails = !config.disableDetails;
    const parsedErrorMessage = parseErrorMessage(error.message);

    if (!config?.disableLog && config.logInstance) {
      (config.logInstance as { error: (arg: unknown) => void }).error(error);
    }

    if (parsedErrorMessage?.type === "validation") {
      set.status = 400;

      return buildResponse(
        {
          code: "VALIDATION_ERROR",
          message: "Bad Request",
          details: [getValidationDetail(error) ?? error.message].filter(Boolean),
        },
        includeDetails,
      );
    }

    if (error.message.toLowerCase().includes("rate limit")) {
      set.status = 429;

      return buildResponse(
        {
          code: "TOO_MANY_REQUESTS",
          message: "Too Many Requests",
          details: [error.message],
        },
        includeDetails,
      );
    }

    if (isCustomError(error)) {
      set.status = resolveStatusCode(error);
      return error.toResponse(includeDetails);
    }

    switch (code) {
      case "PARSE":
      case "INTERNAL_SERVER_ERROR":
      case "INVALID_COOKIE_SIGNATURE":
        set.status = 500;

        return buildResponse(
          {
            code,
            message: error.message || DEFAULT_ERROR_MESSAGE,
            details: [error.message],
          },
          includeDetails,
        );
      case "NOT_FOUND":
        set.status = 404;

        return buildResponse(
          {
            code: "NOT_FOUND",
            message: "Not Found",
          },
          includeDetails,
        );
      case "UNKNOWN":
        set.status = 500;
        return buildResponse(
          {
            code: "INTERNAL_SERVER_ERROR",
            message: DEFAULT_ERROR_MESSAGE,
            details: [parsedErrorMessage?.message, error.message].filter(
              (value): value is string => typeof value === "string" && value.length > 0,
            ),
          },
          includeDetails,
        );
      default:
        return;
    }
  });
};
