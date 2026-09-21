// A typed error carrying the HTTP status it should map to, so route handlers
// can throw from deep inside a transaction and translate to a response with
// one catch clause instead of duplicating status-code logic at each call site.
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
