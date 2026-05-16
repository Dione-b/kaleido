import semver from "semver";
import { CaatingaError, CaatingaErrorCode } from "../errors/CaatingaError.js";

// 22.x fails to sign `stellar contract invoke` (xdr value invalid); 23.0.0+ is required.
export const STELLAR_CLI_MIN_VERSION = "23.0.0";
export const STELLAR_CLI_TESTED_MAX_VERSION = "25.2.0";

const STELLAR_CLI_SEMVER_REGEX = /\b(\d+\.\d+\.\d+(?:-[0-9A-Za-z-.]+)?(?:\+[0-9A-Za-z-.]+)?)\b/;

export function parseStellarCliVersion(output: string): string {
  const match = output.match(STELLAR_CLI_SEMVER_REGEX);

  const version = match?.[1];

  if (!version || !semver.valid(version)) {
    throw new CaatingaError(
      "Could not parse Stellar CLI version from command output.",
      CaatingaErrorCode.STELLAR_CLI_VERSION_PARSE_FAILED,
      "Run `stellar --version` and verify that the output includes a semantic version."
    );
  }

  return version;
}

export function assertSupportedStellarCliVersion(input: {
  version: string;
  allowUntested: boolean;
}): string {
  const normalizedVersion = semver.valid(input.version);

  if (!normalizedVersion) {
    throw new CaatingaError(
      "Could not parse Stellar CLI version.",
      CaatingaErrorCode.STELLAR_CLI_VERSION_PARSE_FAILED,
      "Use a semantic version such as 22.0.1."
    );
  }

  if (semver.lt(normalizedVersion, STELLAR_CLI_MIN_VERSION)) {
    throw new CaatingaError(
      `Stellar CLI ${normalizedVersion} is below the supported minimum ${STELLAR_CLI_MIN_VERSION}.`,
      CaatingaErrorCode.UNSUPPORTED_CLI_VERSION,
      `Install Stellar CLI ${STELLAR_CLI_MIN_VERSION} or newer.`
    );
  }

  if (!input.allowUntested && semver.gt(normalizedVersion, STELLAR_CLI_TESTED_MAX_VERSION)) {
    throw new CaatingaError(
      `Stellar CLI ${normalizedVersion} is newer than the tested maximum ${STELLAR_CLI_TESTED_MAX_VERSION}.`,
      CaatingaErrorCode.UNTESTED_CLI_VERSION,
      "Pass --allow-untested-stellar-cli only after accepting the compatibility risk."
    );
  }

  return normalizedVersion;
}
