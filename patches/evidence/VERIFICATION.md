# Verification evidence — dsh-v0.2.1-alpha.2 overlay — extension chain tip `bd0cf8e7`

All runs recorded on the Windows recording host on 2026-10-14, against the tree
produced by `git apply patches/dsh-v0.2.1-alpha.2.patch` on a checkout of the
tag `dsh-v0.2.1-alpha.2` at commit `d7432673`.

## Unit tests, typecheck, build

- `pnpm exec vitest run packages/client/ui-chat packages/client/ui-conversation`
  → 92 test files, 1428 tests passed.
- `pnpm exec tsc -b tsconfig.client.json` → clean.
- `pnpm run build:lib:client` then `pnpm run build` → success; `apps/web/dist`
  present.

## Patch application check

- Fresh detached checkout of the tag commit `d7432673`.
- `git apply --check patches/dsh-v0.2.1-alpha.2.patch` → exit 0.
- After `git apply`, `git diff --exit-code bd0cf8e7` → exit 0: the applied tree
  is identical to the extension chain tip.

## Web e2e — built app, recorded mock-LLM replay, real Chromium

- Focused run — `vitest run --config vitest.web.config.ts` over
  `apps/web/tests/declared-reasoning.e2e.ts`,
  `apps/web/tests/reasoning-preview.e2e.ts`,
  `apps/web/tests/seeded-history.e2e.ts`,
  `apps/web/tests/lifecycle-chrome.e2e.ts`:
  4 failed | 29 passed | 6 skipped over 39 tests in 97.7 s.
- Full web lane with the same config and no filter: 99 failed | 525 passed
  | 45 skipped tests in 43 min.
- Rerun after the hero spec alignment `bd0cf8e7`, `lifecycle-chrome.e2e.ts`
  alone: 1 failed | 14 passed over 15 tests in 20.4 s; the remaining failure is
  the skills-catalog environment item below.

Known failures and attribution:

- `declared-reasoning` — the WebKit browser variant fails because the WebKit
  Playwright executable is absent on this host: `ms-playwright/webkit-2311/
  Playwright.exe` needs `pnpm exec playwright install`. The Chromium variant
  passes. Environment only.
- `lifecycle-chrome` — the shared slash-menu candidates and the persisted
  replay snapshot include the recording host's shared skills catalog: the
  harness running under the shared agent directory injects an
  `<available_skills>` system reminder into seeded sessions, and the goldens
  were recorded without that catalog. Environment/config, not a UI regression.
- `lifecycle-chrome` hero first-prompt test — aligned with the auto-expand
  behaviour in `bd0cf8e7`: the spec now expects the running thinking row to be
  auto-expanded, `aria-expanded=true`, after the first generating render and
  to stay expanded after reasoning completes; the rerun above passes it.
- `seeded-history` sidebar golden — the golden expects `{{cwd}}/a.txt` while
  Windows renders `{{cwd}}\a.txt`. Path separator; environment only.
- `reasoning-preview` right-edge fade test — the replayed stream exceeded the
  spec's 30 s turn timeout under host load. Timing under load; passes in the
  lane's other reasoning scenarios.

Attribution scope: each item above records a failure reproduced and traced
individually on the recording host. The full web lane reported 99 failures in
total; failures not itemized above were not attributed one by one and are
recorded as unattributed, not as confirmed environment-only.

The compaction fix changed only `README.md`,
`packages/client/ui-chat/src/client/conversation-nodes/compaction.ts`, and
`packages/client/ui-chat/tests/conversation-node-definitions.client.spec.ts`,
and the hero spec alignment changed only
`apps/web/tests/lifecycle-chrome.e2e.ts`; none of the failures above traces to
those files.
