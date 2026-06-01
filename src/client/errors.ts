export type HonchoClientError = {
  readonly _tag: "HonchoClientError";
  readonly message: string;
  readonly status?: number;
};
