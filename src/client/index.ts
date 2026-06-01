import { Context, Effect, Layer } from "effect";
import type { Config } from "../config.js";
import type { HonchoClientError } from "./errors.js";

export const HonchoConfig = Context.GenericTag<Config>("HonchoConfig");

export type HonchoClientService = {
  readonly request: <T>(
    method: string,
    path: string,
    body?: unknown
  ) => Effect.Effect<T | undefined, HonchoClientError>;
};

export const HonchoClient = Context.GenericTag<HonchoClientService>(
  "HonchoClient"
);

export const makeHonchoClient: Effect.Effect<
  HonchoClientService,
  never,
  Config
> = Effect.gen(function* () {
  const config = yield* HonchoConfig;

  const request = <T>(
    method: string,
    path: string,
    body?: unknown
  ): Effect.Effect<T | undefined, HonchoClientError> =>
    Effect.tryPromise({
      try: async () => {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (config.honchoApiKey) {
          headers["Authorization"] = `Bearer ${config.honchoApiKey}`;
        }

        const url = `${config.honchoUrl}/v3${path}`;
        const response = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw Object.assign(
            new Error(`HTTP ${response.status}: ${errorBody}`),
            { status: response.status }
          );
        }

        if (response.status === 204) {
          return (undefined as unknown) as T;
        }

        return response.json() as Promise<T>;
      },
      catch: (error) => {
        const message =
          error instanceof Error ? error.message : String(error);
        const status = (error as { status?: number }).status;
        return {
          _tag: "HonchoClientError" as const,
          message,
          status,
        };
      },
    });

  return { request };
});

export const HonchoClientLayer = Layer.effect(HonchoClient, makeHonchoClient);
