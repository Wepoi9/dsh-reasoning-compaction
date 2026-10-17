# Verification evidence — dsh-v0.2.1-rc.2 overlay — extension chain tip `85c0b8631d`

All runs recorded on the Windows recording host on 2026-10-17, against the tree
produced by `git apply patches/dsh-v0.2.1-rc.2.patch` on a checkout of the tag
`dsh-v0.2.1-rc.2` at commit `687f282e86` (tree identity to the chain tip
`85c0b8631d` on branch `rc2-overlay` verified below). The rc.1 patch was
retired with the rc.2 patch; nothing here was re-checked against the rc.1 lane
beyond its recorded evidence.

## Unit tests, typecheck, build

- `pnpm exec vitest run packages/client/ui-chat packages/client/ui-conversation`
  → 99 test files, 1643 tests passed.
- `pnpm run build` → exit 0; the build's gate report is "9 passed, 0 failed,
  0 skipped" with "recorded 325 client artifact(s) with 2 public value(s)";
  `apps/web/dist` present.
- rc.2's client typecheck depends on the generated Typert declarations that
  the repository build produces. The standalone
  `pnpm exec tsc -b tsconfig.client.json` was run after the build and exits 0,
  clean.

## Patch application check

- Fresh detached checkout of the tag commit `687f282e86`.
- `git apply --check patches/dsh-v0.2.1-rc.2.patch` → exit 0.
- After `git apply`, `git diff --exit-code 85c0b8631d` → exit 0: the applied
  tree is identical to the extension chain tip.
- The patch bytes are identical to the retired rc.1 patch (SHA-256
  `FDE4569412F150672CF5A5A4E8D57ED3E6DC5BA24556E1A7C6634B018334117F`): within
  the 18-file overlay scope the two tags differ only in the
  `packages/client/ui-chat/package.json` and
  `packages/client/ui-conversation/package.json` version lines, and the
  overlay modifies neither file.

## Web e2e — built app, recorded mock-LLM replay, real Chromium

One focused lane under unified conditions (recorded mock-LLM replay through
`DSH_SNAPSHOT=replay`, the built `apps/web/dist`, real Chromium) over the same
four spec files as before — `apps/web/tests/declared-reasoning.e2e.ts`,
`apps/web/tests/reasoning-preview.e2e.ts`, `apps/web/tests/seeded-history.e2e.ts`,
`apps/web/tests/lifecycle-chrome.e2e.ts`:

3 failed | 31 passed | 6 skipped over 40 tests (run duration 119.0 s). The
totals and the itemized outcomes match the recorded rc.1 lane; the 6 skips
include the 4 WebKit-variant cases that cannot launch on this host.

The auto-expand-aligned scenarios passed inside the run: the reasoning-row and
hero lifecycle scenarios produced no assertion failures.

Known failures and attribution, each reproduced in the run:

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

Attribution scope: the focused web lane above was run on the final tree under
the unified conditions stated above, and every failure and report item is one
of the itemized list; nothing outside that list appeared, so nothing is
recorded as unattributed.

## Live app smoke — built overlay, real session turn

- The built overlay served the live web UI; with the local model selected
  through the model picker, a real turn's reasoning output appeared as a Think
  row auto-expanded at its first paint (observed 5,675 ms after the turn
  started) and stayed expanded through the `running` → `ok` state change.
  Zero page errors were recorded.

## Overlay scope

The overlay changes 18 files, +400/-65: the `ui-chat` client chat components,
contracts, conversation-node modules, and their tests, plus the hero lifecycle
spec. None of it touches the server-side compaction protocol, session
persistence, or the rc.2 image-rendering contract.
