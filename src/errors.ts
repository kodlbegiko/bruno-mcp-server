export type BrunoMcpErrorCode =
  | "PATH_OUTSIDE_COLLECTION"
  | "REQUEST_NOT_FOUND"
  | "REQUEST_AMBIGUOUS"
  | "INVALID_COLLECTION"
  | "INVALID_INPUT"
  | "CLI_UNAVAILABLE"
  | "CLI_EXECUTION_FAILURE"
  | "EXECUTION_TIMEOUT";

export class BrunoMcpError extends Error {
  constructor(
    public readonly code: BrunoMcpErrorCode,
    message: string
  ) {
    super(message);
    this.name = "BrunoMcpError";
    Object.setPrototypeOf(this, BrunoMcpError.prototype);
  }
}
