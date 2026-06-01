import { parseArgs } from "node:util";
const parseStorageTargets = (input) => {
    const targets = input.split(",").map((t) => t.trim());
    const valid = new Set(["peer", "session"]);
    for (const target of targets) {
        if (!valid.has(target)) {
            throw new Error(`Invalid storage target: ${target}. Must be 'peer' or 'session'.`);
        }
    }
    return targets;
};
export const parseConfig = () => {
    const { values } = parseArgs({
        args: process.argv.slice(2),
        options: {
            "honcho-url": { type: "string" },
            "honcho-api-key": { type: "string" },
            "storage-targets": { type: "string" },
        },
        strict: false,
    });
    const honchoUrl = values["honcho-url"] ?? process.env["HONCHO_URL"];
    if (!honchoUrl) {
        throw new Error("--honcho-url or HONCHO_URL environment variable is required");
    }
    const storageTargetsStr = values["storage-targets"] ??
        process.env["HONCHO_STORAGE_TARGETS"] ??
        "peer,session";
    return {
        honchoUrl,
        honchoApiKey: values["honcho-api-key"] ??
            process.env["HONCHO_API_KEY"],
        storageTargets: parseStorageTargets(storageTargetsStr),
    };
};
