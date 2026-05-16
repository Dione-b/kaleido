---
"@kaleido-xlm/core": patch
"@kaleido-xlm/cli": patch
---

Fix the generated contract build path to match the supported Stellar CLI flow again.

The official templates and docs now point back to `wasm32-unknown-unknown`, which is the artifact path produced by the supported `stellar contract build` workflow in the current CLI contract. This removes the mismatch where `kaleido build` could succeed at the Stellar step but still fail with `KALEIDO_ARTIFACT_NOT_FOUND` because Kaleido was looking for the wasm file under the wrong target directory.

Also align the public Stellar CLI version documentation with the implemented tested maximum of `25.2.0`.
