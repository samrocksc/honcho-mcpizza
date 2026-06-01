export type QueuedConclusion = {
  readonly content: string;
  readonly observer_id: string;
  readonly observed_id: string;
  readonly session_id?: string;
};

export type QueuedMessage = {
  readonly content: string;
  readonly peer_id: string;
  readonly metadata?: Record<string, unknown>;
  readonly created_at?: string;
};

import type { StorageTarget } from "./config.js";

export type HonchoClientService = {
  readonly request: <T>(
    method: string,
    path: string,
    body?: unknown
  ) => Promise<T | undefined>;
};

type QueueState = {
  readonly conclusions: readonly QueuedConclusion[];
  readonly messages: readonly QueuedMessage[];
  client?: HonchoClientService;
  storageTargets?: readonly StorageTarget[];
};

const state: QueueState = {
  conclusions: [],
  messages: [],
};

export const queue = {
  setClient: (client: HonchoClientService, targets: readonly StorageTarget[]): void => {
    state.client = client;
    state.storageTargets = targets;
  },

  getStorageTargets: (): readonly StorageTarget[] => {
    return state.storageTargets ?? ["peer", "session"];
  },

  addConclusion: (conclusion: QueuedConclusion): void => {
    (state.conclusions as QueuedConclusion[]).push(conclusion);
  },

  addMessage: (message: QueuedMessage): void => {
    (state.messages as QueuedMessage[]).push(message);
  },

  getConclusionsAndClear: (): readonly QueuedConclusion[] => {
    const c = state.conclusions;
    (state.conclusions as QueuedConclusion[]) = [];
    return c;
  },

  getMessagesAndClear: (): readonly QueuedMessage[] => {
    const m = state.messages;
    (state.messages as QueuedMessage[]) = [];
    return m;
  },

  getClient: (): HonchoClientService => {
    if (!state.client) throw new Error("HonchoClient not initialized");
    return state.client;
  },

  conclusionCount: (): number => state.conclusions.length,
  messageCount: (): number => state.messages.length,
};
