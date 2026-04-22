import { logger } from "@bogeychan/elysia-logger";
import { Elysia, status, t } from "elysia";
import {
  BadRequest,
  Conflict,
  CustomError,
  Forbidden,
  InternalServerError,
  NotFound,
  NotImplemented,
  ServiceUnavailable,
  TimeOut,
  TooManyRequests,
  Unauthorized,
} from "unify-errors";

import { PluginUnifyElysia, pluginUnifyElysia } from "../../src";

export class DefaultError extends CustomError {
  constructor(code: string, message: string, details: string[] = []) {
    super(code, {
      message,
      details,
    });

    Object.setPrototypeOf(this, DefaultError.prototype);
  }
}

export const app = (config?: PluginUnifyElysia) => {
  const server = new Elysia()
    .use(
      logger({
        level: "error",
        autoLogging: false,
      }),
    )
    .use(pluginUnifyElysia(config))
    .get("/validation", () => "ok", {
      query: t.Object({
        name: t.String(),
      }),
    })
    .get("/elysia-error", () => {
      return status(401, "Unauthorized");
    })
    .get("/generic-error", () => {
      throw "test";
    })
    .get("/unify-error", () => {
      throw new BadRequest("BAD_REQUEST", {
        message: "Bad Request",
      });
    });

  server.get("/bad-request", async () => {
    throw new BadRequest("BAD_REQUEST", {
      message: "Bad Request",
      details: ["A bad request error"],
    });
  });

  server.get("/unauthorized", async () => {
    throw new Unauthorized("UNAUTHORIZED", {
      message: "Unauthorized",
      details: ["An unauthorized error"],
    });
  });

  server.get("/forbidden", async () => {
    throw new Forbidden("FORBIDDEN", {
      message: "Forbidden",
      details: ["A forbidden error"],
    });
  });

  server.get("/not-found", async () => {
    throw new NotFound("NOT_FOUND", {
      message: "Not Found",
      details: ["A not found error"],
    });
  });

  server.get("/conflict", async () => {
    throw new Conflict("CONFLICT", {
      message: "Conflict",
      details: ["A conflict error"],
    });
  });

  server.get("/request-time-out", async () => {
    throw new TimeOut("REQUEST_TIMEOUT", {
      message: "Request Time-out",
      details: ["A request time out error"],
    });
  });

  server.get("/too-many-requests", async () => {
    throw new TooManyRequests("TOO_MANY_REQUESTS", {
      message: "Too Many Requests",
    });
  });

  server.get("/internal", async () => {
    throw new InternalServerError("INTERNAL_SERVER_ERROR", {
      message: "Internal Server Error",
      details: ["An internal server error"],
    });
  });

  server.get("/not-implemented", async () => {
    throw new NotImplemented("NOT_IMPLEMENTED", {
      message: "Not Implemented",
      details: ["A not implemented error"],
    });
  });

  server.get("/service-unavailable", async () => {
    throw new ServiceUnavailable("SERVICE_UNAVAILABLE", {
      message: "Service Unavailable",
      details: ["A service unavailable error"],
    });
  });

  server.get("/not-custom", async () => {
    throw new Error("A generic, not customized error");
  });

  server.get("/default-case", async () => {
    throw new DefaultError("DEFAULT_ERROR", "A default error", ["A CustomError but not handled"]);
  });

  server.get("/rate-limit", async () => {
    throw new Error("rate limit");
  });

  server.post("/parse-error", async ({ body }) => body, {
    body: t.Object({ name: t.String() }),
  });

  return server;
};
