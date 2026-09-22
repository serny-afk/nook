/**
 * The API's own error type, carrying an HTTP status. Routes and services throw
 * these to signal a specific client-facing failure; the central error handler
 * turns them into the matching status + message. Anything thrown that is *not*
 * an ApiError is treated as an unexpected fault and becomes an opaque 500. This
 * keeps handlers thin — they throw, they never format error responses.
 *
 * Scoped to the API tier on purpose: an HTTP status is meaningless to the
 * realtime server or the client, so this does not live in `@nook/shared`.
 *
 * Future: a stable machine-readable `code` (e.g. "PROFILE_NOT_FOUND") for
 * clients to branch on, added with the validation/error milestone.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** The request was malformed (missing/invalid fields). */
export const badRequest = (message = "Bad Request") => new ApiError(400, message);

/** The requested resource does not exist. */
export const notFound = (message = "Not Found") => new ApiError(404, message);
