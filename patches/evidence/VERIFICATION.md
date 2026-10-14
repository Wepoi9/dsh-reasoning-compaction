# Verification evidence — dsh-v0.2.1-alpha.2 overlay — extension commit `9a304e85`

All runs recorded on the Windows recording host on 2026-10-14, against the tree
produced by `git apply patches/dsh-v0.2.1-alpha.2.patch` on a checkout of the
tag `dsh-v0.2.1-alpha.2` at commit `d7432673`.

## Unit tests, typecheck, build

- `pnpm exec vitest run packages/client/ui-chat packages/client/ui-conversation`
  → 92 test files, 1428 tests passed.
- `pnpm run build` → success; `apps/web/dist` present.
- `pnpm exec tsc -b tsconfig.client.json` → clean after that build. The client
  graph consumes generated host declarations (the repository's own `typecheck`
  script runs `build:lib:host` first), so a bare `tsc -b` on a fresh checkout
  reports missing-namespace errors in packages untouched by this overlay until
  those artifacts exist.

## Status-title change in this revision

`CompactionItem.tsx` titles automatic progress rows by status — the running
title is `message.compaction.running`, the failed title
`message.compaction.failed` — instead of the shared completed title; completed
and manual `/compact` rows keep `message.compaction`. Chat-view spec assertions
were aligned: the running test pins title and summary and their absence once
the Session settles; the failed test pins the failed title with the transient
reason as summary; the no-message fallback row shows the failed string as both
title and summary, pinned as two matches inside that render's own container
(the shared `document.body` also holds the earlier render in the same test).
`apps/web/tests/seeded-history.e2e.ts` only asserts that stale
`Context compacted` rows are absent, an assertion the title change preserves.

## Patch application check

- Fresh detached worktree checkout of the tag commit `d7432673`.
- `git apply --check patches/dsh-v0.2.1-alpha.2.patch` → exit 0; `git apply`
  applied 19 files with no rejects.
- After `git apply`, `git diff --exit-code 9a304e85` → exit 0: the applied tree
  is identical to the extension commit `9a304e85` recorded on top of the tag.
- The patch is LF-normalized and carries no README appendix; distribution
  documentation lives in this repository's README only. `.gitattributes` pins
  the patch bytes (`-text`) so every checkout ships the same LF patch the
  recording host applied.

## Web e2e — recorded 2026-10-14 on this host, not rerun for the title revision

Recorded against the pre-title tree with the built app, recorded mock-LLM
replay, real Chromium:

- Focused run — `vitest run --config vitest.web.config.ts` over
  `apps/web/tests/declared-reasoning.e2e.ts`,
  `apps/web/tests/reasoning-preview.e2e.ts`,
  `apps/web/tests/seeded-history.e2e.ts`,
  `apps/web/tests/lifecycle-chrome.e2e.ts`:
  4 failed | 29 passed | 6 skipped over 39 tests in 97.7 s.
- Full web lane, same config, no filter: 99 failed | 525 passed | 45 skipped
  tests in 43 min.
- Hero spec alignment rerun, `lifecycle-chrome.e2e.ts` alone: 1 failed | 14
  passed over 15 tests in 20.4 s; the remaining failure is the skills-catalog
  environment item below.

Known failures and attribution, each reproduced and traced individually:

- `declared-reasoning` — the WebKit Playwright executable is absent on this
  host (`pnpm exec playwright install`); the Chromium variant passes.
  Environment only.
- `lifecycle-chrome` — the shared slash-menu candidates and the persisted
  replay snapshot include the recording host's shared skills catalog injected
  as an `<available_skills>` reminder into seeded sessions; the goldens were
  recorded without it. Environment/config, not a UI regression.
- `lifecycle-chrome` hero first-prompt test — aligned with the auto-expand
  behaviour; the spec expects the running thinking row auto-expanded after
  the first generating render and the rerun passes it.
- `seeded-history` sidebar golden — expects `{{cwd}}/a.txt` while Windows
  renders `{{cwd}}\a.txt`. Path separator; environment only.
- `reasoning-preview` right-edge fade test — the replayed stream exceeded the
  spec's 30 s turn timeout under host load; passes in the lane's other
  reasoning scenarios.

The full web lane reported 99 failures in total; failures not itemized above
were not attributed one by one and are recorded as unattributed, not as
confirmed environment-only.

The title revision touched `packages/client/ui-chat/src/client/chat/CompactionItem.tsx`
and `packages/client/ui-chat/tests/chat-view.client.spec.tsx` only, plus the
locale strings it reads; no e2e spec asserts a status title, and the
seeded-history check above is an absence assertion.
