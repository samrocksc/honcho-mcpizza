const state = {
    conclusions: [],
    messages: [],
};
export const queue = {
    setClient: (client, targets) => {
        state.client = client;
        state.storageTargets = targets;
    },
    getStorageTargets: () => {
        return state.storageTargets ?? ["peer", "session"];
    },
    addConclusion: (conclusion) => {
        state.conclusions.push(conclusion);
    },
    addMessage: (message) => {
        state.messages.push(message);
    },
    getConclusionsAndClear: () => {
        const c = state.conclusions;
        state.conclusions = [];
        return c;
    },
    getMessagesAndClear: () => {
        const m = state.messages;
        state.messages = [];
        return m;
    },
    getClient: () => {
        if (!state.client)
            throw new Error("HonchoClient not initialized");
        return state.client;
    },
    conclusionCount: () => state.conclusions.length,
    messageCount: () => state.messages.length,
};
