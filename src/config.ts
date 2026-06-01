import { parseArgs } from "node:util";

export type StorageTarget = "peer" | "session";

export type Config = {
  readonly honchoUrl: string;
  readonly honchoApiKey?: string;
  readonly storageTargets: readonly StorageTarget[];
  readonly workspaceId?: string;
  readonly peerName?: string;
  readonly aiPeer?: string;
};

const parseStorageTargets = (input: string): StorageTarget[] => {
  const targets = input.split(",").map((t) => t.trim()) as StorageTarget[];
  const valid = new Set<StorageTarget>(["peer", "session"]);
  for (const target of targets) {
    if (!valid.has(target)) {
      throw new Error(`Invalid storage target: ${target}. Must be 'peer' or 'session'.`);
    }
  }
  return targets;
};

export const parseConfig = (): Config => {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      "honcho-url": { type: "string" },
      "honcho-api-key": { type: "string" },
      "storage-targets": { type: "string" },
      "workspace-id": { type: "string" },
      "peer-name": { type: "string" },
      "ai-peer": { type: "string" },
    },
    strict: false,
  });

  const honchoUrl =
    (values["honcho-url"] as string | undefined) ?? process.env["HONCHO_URL"];

  if (!honchoUrl) {
    throw new Error("--honcho-url or HONCHO_URL environment variable is required");
  }

  const storageTargetsStr =
    (values["storage-targets"] as string | undefined) ??
    process.env["HONCHO_STORAGE_TARGETS"] ??
    "peer,session";

  return {
    honchoUrl,
    honchoApiKey:
      (values["honcho-api-key"] as string | undefined) ??
      process.env["HONCHO_API_KEY"],
    storageTargets: parseStorageTargets(storageTargetsStr),
    workspaceId:
      (values["workspace-id"] as string | undefined) ??
      process.env["HONCHO_WORKSPACE_ID"],
    peerName:
      (values["peer-name"] as string | undefined) ??
      process.env["HONCHO_PEER_NAME"],
    aiPeer:
      (values["ai-peer"] as string | undefined) ??
      process.env["HONCHO_AI_PEER"],
  };
};
