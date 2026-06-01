import { Context, Effect, Layer } from "effect";
export const HonchoConfig = Context.GenericTag("HonchoConfig");
export const HonchoClient = Context.GenericTag("HonchoClient");
export const makeHonchoClient = Effect.gen(function* () {
    const config = yield* HonchoConfig;
    const request = (method, path, body) => Effect.tryPromise({
        try: async () => {
            const headers = {
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
                throw Object.assign(new Error(`HTTP ${response.status}: ${errorBody}`), { status: response.status });
            }
            if (response.status === 204) {
                return undefined;
            }
            return response.json();
        },
        catch: (error) => {
            const message = error instanceof Error ? error.message : String(error);
            const status = error.status;
            return {
                _tag: "HonchoClientError",
                message,
                status,
            };
        },
    });
    return { request };
});
export const HonchoClientLayer = Layer.effect(HonchoClient, makeHonchoClient);
