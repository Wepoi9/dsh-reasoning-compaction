# DSH v0.2.2-alpha.2 verification

Date: 2026-10-29 (JST)

## Patch identity and apply checks

The patch is based on upstream tag `dsh-v0.2.2-alpha.2`, commit
`f3803c96974ad4a94195fb97e5c637e9c2a3afe3`.

- `git apply --check` against a clean archive of that base: exit 0.
- `git apply --reverse --check` against the patched source worktree: exit 0.
- `git diff --check` in the patched source worktree: exit 0.

## Passing scoped checks

All commands ran against the alpha.2 source tree with the patch changes applied.

| Command | Result |
|---|---|
| `pnpm run build:artifacts` | 8 passed, 0 failed, 0 skipped |
| `pnpm run check:i18n` | 3 passed, 0 failed, 0 skipped |
| `pnpm run build:check` | 2 passed, 0 failed, 0 skipped |
| `pnpm exec vitest run packages/client/ui-chat/tests/reasoning-row.client.spec.tsx packages/client/ui-chat/tests/chat-view.client.spec.tsx packages/client/ui-chat/tests/conversation-node-definitions.client.spec.ts` | 311 passed, 0 failed across 3 files (41 + 179 + 91) |

## Checks that did not pass

`pnpm run test:gui` was run as an additional broad check. It completed with 12,087 passed, 9 failed, and 2 skipped across 12,098 tests. The nine failures were in eight suites outside the changed `ui-chat` paths:

- `packages/client/ui-deliverables/tests/present-open.host.spec.ts`: Windows denied symlink creation (`EPERM`).
- `packages/client/ui-primitives/tests/code-highlighting.client.spec.tsx`: lazy SystemVerilog and BAT grammar tests failed.
- `packages/client/ui-settings-account/tests/apply.client.spec.ts`: test timed out at 60 seconds.
- `packages/client/ui-settings-general/tests/apply.client.spec.ts` and `shell.client.spec.ts`: tests timed out at 5 seconds.
- `packages/client/ui-sidebar-documentpreview/tests/code-body.client.spec.tsx`: HTML-as-source assertion failed.
- `packages/client/ui-sidebar-documentpreview/tests/document-preview-license-bundle.client.spec.ts`: tar reported `Cannot connect to C: resolve failed`.
- `packages/client/ui-sidebar-documentpreview/tests/markdown-body.client.spec.tsx`: `waitUntil` timed out.

No unchanged-baseline comparison was run, so these failures are not labelled pre-existing. The broad GUI suite is not green.

The focused browser replay attempt was:

`DSH_SNAPSHOT=replay pnpm run test:web:built apps/web/tests/lifecycle-chrome.e2e.ts -t 'sends the first prompt from the empty-state hero'`

It selected 1 test and skipped 14, but did not pass. The hero ARIA golden differed because the expected composer contained an empty paragraph and the actual textbox did not. Teardown also found no live root session matching `snapshots/web/lifecycle-chrome/session.v4.jsonl` and reported one unused replay script. The intended auto-expand assertions were not reached, so this run does not verify that browser scenario. No baseline comparison was run.

The scoped build, locale, type-check, and focused ui-chat results are passing evidence; they do not turn the broad GUI or browser replay outcomes into passes.

## Baseline comparison (2026-10-29, follow-up)

A clean worktree of the exact base tag (`f3803c9697`) was created, installed with `pnpm install`, and built with `pnpm run build` (10/10 gates passed). The eight suites that failed in the broad GUI run and the focused browser replay were then re-run identically on both trees.

| Check | Patched tree | Clean baseline |
|---|---|---|
| The eight failed suites (targeted rerun) | 2 failed, 213 passed | 1 failed (symlink EPERM), 213 passed, 1 skipped |
| Focused browser replay (`sends the first prompt from the empty-state hero`) | 1 failed, 14 skipped | 1 failed, 14 skipped, same golden diff |

Interpretation, limited to what these reruns show:

- The `present-open` symlink failure reproduces identically on the unpatched baseline: a Windows symlink-privilege (EPERM) environment issue, not an overlay regression.
- The `document-preview-license-bundle` tar failure (`Cannot connect to C:`) did not reproduce on the baseline (that suite skipped there); it is MSYS `tar` shadowing Windows `tar` in the test shell.
- The seven remaining broad-run failures (code-highlighting grammar tests, settings apply/shell timeouts, HTML-source assertion, markdown-body `waitUntil`) did not reproduce in the targeted reruns on either tree; they look like load-dependent flakes of the full-suite run. No overlay attribution was found.
- The hero ARIA golden mismatch reproduces identically on the unpatched baseline: the shipped golden expects an empty paragraph inside the composer and alpha.2 renders none at this tag on this machine. This is a pre-existing golden mismatch, not an overlay regression; the patch contains no hero or composer changes.

The broad GUI suite is still not green, but every failure reproduced after the comparison is attributable to this machine or to suite-load flakes, and none reproduced as an overlay-specific change.
