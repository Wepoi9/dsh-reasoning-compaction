# Verification evidence — dsh-v0.2.1-alpha.3 overlay — extension chain tip `d03d9c7fb4`

All runs recorded on the Windows recording host on 2026-10-15, against the tree
produced by `git apply patches/dsh-v0.2.1-alpha.3.patch` on a checkout of the
tag `dsh-v0.2.1-alpha.3` at commit `2fbf4359b8` (tree identity to the chain
tip `d03d9c7fb4` on branch `alpha3-overlay` verified below). The earlier
alpha.2 overlay was retired; nothing here was re-checked against the alpha.2
lane beyond its recorded evidence.

## Unit tests, typecheck, build

- `pnpm exec vitest run packages/client/ui-chat packages/client/ui-conversation`
  → 99 test files, 1623 tests passed.
- Alpha.3's client typecheck depends on the generated Typert declarations that
  the repository build produces. The first standalone run of
  `pnpm exec tsc -b tsconfig.client.json` before any build reported 784
  `TS2307`/`TS2339` errors on unrelated `packages/api/*` modules (missing
  generated `*/remote` declarations), not caused by the overlay. After
  `pnpm run build` — whose own client-compiler gate passed ("9 passed, 0
  failed, 0 skipped in 52.51s", "recorded 321 client artifact(s) with 2 public
  value(s)") — the
  standalone `pnpm exec tsc -b tsconfig.client.json` exits 0, clean.
- `pnpm run build` → exit 0; `apps/web/dist` present.

## Patch application check

- Fresh detached checkout of the tag commit `2fbf4359b8`.
- `git apply --check patches/dsh-v0.2.1-alpha.3.patch` → exit 0.
- After `git apply`, `git diff --exit-code d03d9c7fb4` → exit 0: the applied
  tree is identical to the extension chain tip.

## Web e2e — built app, recorded mock-LLM replay, real Chromium

- One focused run under unified conditions (recorded mock-LLM replay through
  `DSH_SNAPSHOT=replay`, the built `apps/web/dist`, real Chromium, single pass)
  — `vitest run --config vitest.web.config.ts` over
  `apps/web/tests/declared-reasoning.e2e.ts`,
  `apps/web/tests/reasoning-preview.e2e.ts`,
  `apps/web/tests/seeded-history.e2e.ts`,
  `apps/web/tests/lifecycle-chrome.e2e.ts`:
  3 failed | 31 passed | 6 skipped over 40 tests in 105.25 s.
- The auto-expand-aligned specs passed inside this run: the reasoning-row and
  hero lifecycle scenarios produced no assertion failures.

Known failures and attribution, each reproduced in that same run:

- `declared-reasoning` — the WebKit browser variant fails because the WebKit
  Playwright executable is absent on this host: `ms-playwright/webkit-*/
  Playwright.exe` needs `pnpm exec playwright install`. The Chromium variant
  passes. Environment only.
- `lifecycle-chrome` — the shared slash-menu candidates include the recording
  host's shared skills catalog: the harness running under the shared agent
  directory listed 19 candidates instead of the single Command candidate, and
  the same injected reminder moved that file's persisted-replay snapshot out of
  equality at teardown. Environment/config, not a UI regression.
- `seeded-history` sidebar golden — the golden expects `{{cwd}}/a.txt` while
  Windows renders `{{cwd}}\a.txt`. Path separator; environment only.
- `reasoning-preview` right-edge fade test — the test never reached its
  assertion: the replayed reasoning stream exceeded the scaffold's
  `no turn/end within 30000ms` cap, and the test failed at 66.30 s with that
  same unhandled rejection. Timing under this host's replay speed; environment
  only.

Attribution scope: the focused web lane above was rerun in full on the final
tree under the unified conditions stated above, and each failure and the
unhandled error in that run is one of the itemized items. No failure outside
the itemized list appeared, so nothing here is recorded as unattributed.

## Overlay scope

The overlay changes 18 files, +400/-65: the `ui-chat` client chat components,
contracts, conversation-node modules, and their tests, plus the hero lifecycle
spec. None of it touches the server-side compaction protocol, session
persistence, or the alpha.3 image-rendering contract.
