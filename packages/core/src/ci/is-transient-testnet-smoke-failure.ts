const NO_RETRY_KALEIDO_SUBSTRINGS = [
  "KALEIDO_UNSUPPORTED_CLI_VERSION",
  "KALEIDO_UNTESTED_CLI_VERSION",
  "KALEIDO_STELLAR_CLI_VERSION_PARSE_FAILED",
  "KALEIDO_STELLAR_CLI_NOT_FOUND",
  "KALEIDO_INVALID_CONFIG",
  "KALEIDO_CONFIG_NOT_FOUND"
];

const TRANSIENT_PATTERN =
  /timeout|i\/o timeout|econnreset|connection reset|503|502|429|rate limit|temporar|bad gateway|fetch failed|network error|unavailable/i;

export function isTransientTestnetSmokeFailure(logText: string): boolean {
  if (!logText.trim()) {
    return false;
  }
  for (const marker of NO_RETRY_KALEIDO_SUBSTRINGS) {
    if (logText.includes(marker)) {
      return false;
    }
  }
  return TRANSIENT_PATTERN.test(logText);
}
