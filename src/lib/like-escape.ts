/**
 * Escapes SQL LIKE/ILIKE wildcard metacharacters (`%`, `_`, and the escape
 * character `\` itself) so a value used as a PostgREST `.ilike()` pattern is
 * matched literally instead of as a wildcard pattern.
 *
 * Without this, a value containing `_` or `%` (both legal in Telegram
 * usernames) silently turns into a wildcard match against other rows —
 * e.g. handle "john_doe" also matches "johnXdoe" for any character X.
 */
export function escapeLikePattern(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}
