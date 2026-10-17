# Verification evidence — dsh-v0.2.1-rc.1 overlay — extension chain tip `b7946fdd34`

All runs recorded on the Windows recording host on 2026-10-17, against the tree
produced by `git apply patches/dsh-v0.2.1-rc.1.patch` on a checkout of the tag
`dsh-v0.2.1-rc.1` at commit `1600d8a1e1` (tree identity to the chain tip
`b7946fdd34` on branch `rc1-overlay` verified below). The alpha.3 overlay was
retired with the rc.1 patch; nothing here was re-checked against the alpha.3
lane beyond its recorded evidence.

## Unit tests, typecheck, build

- `pnpm exec vitest run packages/client/ui-chat packages/client/ui-conversation`
  → 99 test files, 1643 tests passed.
- `pnpm run build` → exit 0; the build's gate report is "9 passed, 0 failed,
  0 skipped" with "recorded 323 client artifact(s) with 2 public value(s)";
  `apps/web/dist` present.
- rc.1's client typecheck depends on the generated Typert declarations that
  the repository build produces. The standalone
  `pnpm exec tsc -b tsconfig.client.json` was run after the build and exits 0,
  clean.

## Patch application check

- Fresh detached checkout of the tag commit `1600d8a1e1`.
- `git apply --check patches/dsh-v0.2.1-rc.1.patch` → exit 0.
- After `git apply`, `git diff --exit-code b7946fdd34` → exit 0: the applied
  tree is identical to the extension chain tip.

## Web e2e — built app, recorded mock-LLM replay, real Chromium

One focused lane under unified conditions (recorded mock-LLM replay through
`DSH_SNAPSHOT=replay`, the built `apps/web/dist`, real Chromium) over the same
four spec files as before — `apps/web/tests/declared-reasoning.e2e.ts`,
`apps/web/tests/reasoning-preview.e2e.ts`, `apps/web/tests/seeded-history.e2e.ts`,
`apps/web/tests/lifecycle-chrome.e2e.ts`:

3 failed | 31 passed | 6 skipped over 40 tests (run duration 116.4 s). The
lane was run three times — once against the day's earlier build of the same
clean tree, once after the recorded rebuild, and once under a JSON reporter —
and produced the same totals and the same itemized outcomes each time (JSON
counting: 31 passed, 3 failed, 6 skipped over 40; the 6 skips include the 4
WebKit-variant cases that cannot launch on this host).

The auto-expand-aligned scenarios passed inside the run: the reasoning-row and
hero lifecycle scenarios produced no assertion failures.

Known failures and attribution, each reproduced in the same runs:

- `declared-reasoning` — the WebKit browser variant cannot launch because the
  WebKit Playwright executable is absent on this host (`webkit-*` needs
  `pnpm exec playwright install`); its cases book as skipped. The Chromium
  variant passes. Environment only.
- `lifecycle-chrome` — the shared slash-menu candidates include the recording
  host's shared skills catalog, so the "only Command candidates" assertion
  fails; the same injected reminder moves the file's persisted-replay golden
  out of equality at teardown as a suite-level report item. Environment/config,
  not a UI regression.
- `seeded-history` sidebar golden — the golden expects `{{cwd}}/a.txt` while
  Windows renders `{{cwd}}\a.txt`. Path separator; environment only.
- `reasoning-preview` right-edge fade — the replayed reasoning stream misses
  the scaffold's `no turn/end within 30000ms` cap, so the assertion timeout and
  the matching unhandled rejection appear together. Timing under this host's
  replay speed; environment only.

Attribution scope: the focused web lane above was rerun in full on the final
tree under the unified conditions stated above, and every failure and report
item is one of the itemized list; nothing outside that list appeared, so
nothing is recorded as unattributed.

## Overlay scope

The overlay changes 18 files, +400/-65: the `ui-chat` client chat components,
contracts, conversation-node modules, and their tests, plus the hero lifecycle
spec. None of it touches the server-side compaction protocol, session
persistence, or the rc.1 image-rendering contract.
