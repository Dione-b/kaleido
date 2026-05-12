# Error Code Policy

`KALEIDO_*` error codes are public API. Automation may parse `code`; it must not parse message text.

## Semver Rules

- Adding a new `KALEIDO_*` code: minor change.
- Removing a `KALEIDO_*` code: major change.
- Renaming a `KALEIDO_*` code: major change.
- Changing the meaning of a code: major change.
- Changing message text only: patch change.

## Required Fields

Every documented code must include meaning, likely cause, suggested fix, CI handling recommendation, and semver stability.
