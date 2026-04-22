/* eslint-disable @typescript-eslint/ban-ts-comment */
import { beforeAll, describe, expect, it } from "bun:test";
import Elysia from "elysia";

import { app } from "./utils/server.test";

const testRoute = async (
  server: Elysia,
  routePath: string,
  supposedMessage: Record<string, unknown> | string | undefined | null,
  supposedStatus: number,
): Promise<unknown> => {
  let status: number;
  let content: Record<string, unknown> | string | undefined | null;
  let json = false;

  await server.handle(new Request(`http://localhost${routePath}`)).then(async (res) => {
    status = res.status;

    try {
      content = await res.json();
      json = true;
      return;
      // eslint-disable-next-line no-empty
    } catch {}

    try {
      content = await res.text();
      return;
      // eslint-disable-next-line no-empty
    } catch {}

    return;
  });

  if (json) {
    //@ts-ignore
    expect(content).toMatchObject(supposedMessage);
  } else {
    //@ts-ignore
    expect(content).toEqual(supposedMessage);
  }
  expect(status!).toBe(supposedStatus);

  return;
};

describe("Unify Elysia", () => {
  let currentApp: Elysia;

  beforeAll(() => {
    //@ts-ignore
    currentApp = app();
  });

  it("should handle validation", async () => {
    await testRoute(
      currentApp,
      "/validation",
      {
        code: "VALIDATION_ERROR",
        message: "Bad Request",
        details: ["Expected string"],
      },
      400,
    );
  });

  it("should handle elysia error", async () => {
    await testRoute(currentApp, "/elysia-error", undefined, 401);
  });

  it("should handle generic error", async () => {
    await testRoute(
      currentApp,
      "/generic-error",
      {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occured",
        details: ["test"],
      },
      500,
    );
  });

  it("should handle error from unify", async () => {
    await testRoute(
      currentApp,
      "/unify-error",
      {
        code: "BAD_REQUEST",
        message: "Bad Request",
      },
      400,
    );
  });

  it("bad request", async () => {
    await testRoute(
      currentApp,
      "/bad-request",
      {
        code: "BAD_REQUEST",
        message: "Bad Request",
        details: ["A bad request error"],
      },
      400,
    );
  });

  it("unauthorized", async () => {
    await testRoute(
      currentApp,
      "/unauthorized",
      {
        code: "UNAUTHORIZED",
        message: "Unauthorized",
        details: ["An unauthorized error"],
      },
      401,
    );
  });

  it("forbidden", async () => {
    await testRoute(
      currentApp,
      "/forbidden",
      {
        code: "FORBIDDEN",
        message: "Forbidden",
        details: ["A forbidden error"],
      },
      403,
    );
  });

  it("not-found", async () => {
    await testRoute(
      currentApp,
      "/not-found",
      {
        code: "NOT_FOUND",
        message: "Not Found",
        details: ["A not found error"],
      },
      404,
    );

    await testRoute(
      currentApp,
      "/not-found-url-not-registered",
      {
        code: "NOT_FOUND",
        message: "Not Found",
      },
      404,
    );
  });

  it("conflict", async () => {
    await testRoute(
      currentApp,
      "/conflict",
      {
        code: "CONFLICT",
        message: "Conflict",
        details: ["A conflict error"],
      },
      409,
    );
  });

  it("time-out", async () => {
    await testRoute(
      currentApp,
      "/request-time-out",
      {
        code: "REQUEST_TIMEOUT",
        message: "Request Time-out",
        details: ["A request time out error"],
      },
      408,
    );
  });

  it("too-many-requests", async () => {
    await testRoute(
      currentApp,
      "/too-many-requests",
      {
        code: "TOO_MANY_REQUESTS",
        message: "Too Many Requests",
      },
      429,
    );
  });

  it("internal", async () => {
    await testRoute(
      currentApp,
      "/internal",
      {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal Server Error",
        details: ["An internal server error"],
      },
      500,
    );
  });

  it("not-implemented", async () => {
    await testRoute(
      currentApp,
      "/not-implemented",
      {
        code: "NOT_IMPLEMENTED",
        message: "Not Implemented",
        details: ["A not implemented error"],
      },
      501,
    );
  });

  it("service unavailable", async () => {
    await testRoute(
      currentApp,
      "/service-unavailable",
      {
        code: "SERVICE_UNAVAILABLE",
        message: "Service Unavailable",
        details: ["A service unavailable error"],
      },
      503,
    );
  });

  it("rate limit", async () => {
    await testRoute(
      currentApp,
      "/rate-limit",
      {
        code: "TOO_MANY_REQUESTS",
        message: "Too Many Requests",
        details: ["rate limit"],
      },
      429,
    );
  });

  it("error not extending 'CustomError' from 'unify-errors'", async () => {
    await testRoute(
      currentApp,
      "/not-custom",
      {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occured",
        details: ["A generic, not customized error"],
      },
      500,
    );
  });

  it("default error extending 'CustomError' from 'unify-errors'", async () => {
    await testRoute(
      currentApp,
      "/default-case",
      {
        code: "DEFAULT_ERROR",
        message: "A default error",
        details: ["A CustomError but not handled"],
      },
      500,
    );
  });
});

describe("Unify Elysia - PARSE error", () => {
  let currentApp: Elysia;

  beforeAll(() => {
    //@ts-ignore
    currentApp = app();
  });

  it("should return 500 with code on malformed JSON body", async () => {
    let status: number;
    let content: Record<string, unknown>;

    await currentApp
      .handle(
        new Request("http://localhost/parse-error", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "not-valid-json{",
        }),
      )
      .then(async (res) => {
        status = res.status;
        content = await res.json();
      });

    //@ts-ignore
    expect(status!).toBe(500);
    //@ts-ignore
    expect(content!).toMatchObject({ code: "PARSE" });
  });
});

describe("Unify Elysia - with logInstance", () => {
  let currentApp: Elysia;

  beforeAll(() => {
    //@ts-ignore
    currentApp = app({ logInstance: console });
  });

  it("should log errors via logInstance", async () => {
    await testRoute(
      currentApp,
      "/bad-request",
      { code: "BAD_REQUEST", message: "Bad Request" },
      400,
    );
  });
});

describe("Unify Elysia - disableDetails", () => {
  it("should keep code and message while stripping details", async () => {
    //@ts-ignore
    const currentApp: Elysia = app({ disableDetails: true });

    await testRoute(
      currentApp,
      "/bad-request",
      {
        code: "BAD_REQUEST",
        message: "Bad Request",
        details: [],
      },
      400,
    );
  });
});
