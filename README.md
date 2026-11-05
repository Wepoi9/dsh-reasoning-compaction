# DSH reasoning auto-expand & automatic compaction progress — patch distribution

English | [日本語](README.ja.md)

Two client-chat UI changes for
[deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness),
shipped as a patch overlay instead of a forked tree.

- Reasoning blocks auto-expand once at the first generating render that has body
  text (DSH batches reasoning diffs, so body text can exist at first paint); a
  manual close is then respected for the rest of the generation. If no reasoning
  body ever appears, check the model request's reasoning effort first: it comes
  from the model's default effort or the effort selected in the model picker
  (`reasoningEffort`), and a `none`/minimal effort returns no reasoning body at
  all, so set it to `high` when testing this feature.
- Automatic compaction progress renders as a display-only `running`/`failed`
  row. A `running` row requires a Turn-anchored start with an open Turn, no
  checkpoint or end event, and a running Session. An automatic error-bearing
  `compaction/end` without a checkpoint creates a `failed` row; it is not
  gated on `Session.running` and remains visible after the Session settles.
  Session-level or closed-Turn starts, and interrupted starts without an end,
  never render as running progress. `/compact` markers and Trajectory views
  keep their existing behaviour.

Supported upstream versions: tag `dsh-v0.2.2-rc.1` (commit `66491b05e3`), tag `dsh-v0.2.2-alpha.2` (commit `f3803c9697`), and tag `dsh-v0.2.1-rc.2` (commit `687f282e86`), with one patch per version.

**DSH 0.2.2-rc.1 needs its own patch.** Upstream at that tag has neither behavior: `ReasoningRow.tsx` carries no `generationLive` and no auto-expand effect, and `conversation-nodes/compaction.ts` builds no `CompactionProgressNode`. `git grep -l` for either symbol over `packages/client` returns nothing, and the tag's `ReasoningRow.tsx` (112 lines) contains no `useEffect` or `setExpanded`. The alpha.2 patch stops applying there because rc.1 rewrote the chat structure (the reasoning Body Slot gained `rawText`, and `fileMentions` moved to `AssistantNodeInjected`), not because upstream absorbed the behavior, so the overlay was re-ported: [`patches/dsh-v0.2.2-rc.1.patch`](patches/dsh-v0.2.2-rc.1.patch), 18 files, `git apply --check` passes on a clean checkout of the tag and reverse-applies to the patched tree. Command output, the five conflict resolutions, and the rc.1 verification results are in [`patches/evidence/RC1-PATCH.md`](patches/evidence/RC1-PATCH.md). An earlier record (`RC1-NATIVE.md`) claimed upstream already shipped both; it read a working tree that already had the overlay applied.

`patches/dsh-v0.2.2-alpha.2.patch` is based on
`dsh-v0.2.2-alpha.2` (commit `f3803c96974a`). It applies cleanly to a clean
base and reverse-applies cleanly to the patched tree. The alpha.2-specific
verification record is
[`patches/evidence/VERIFICATION-dsh-v0.2.2-alpha.2.md`](patches/evidence/VERIFICATION-dsh-v0.2.2-alpha.2.md):
8/8 artifact-build gates, 3/3 i18n gates, 2/2 build-check gates, and all 311
focused ui-chat tests passed. The wider GUI suite and focused browser replay
were not green; their exact outcomes and limitations are recorded there, not
claimed as passing. A follow-up clean-baseline comparison in the same evidence
file reproduced the symlink EPERM and hero-golden failures on the unpatched
tag as well, so none of the reproduced failures is attributed to the overlay.
The same file also records a passing live-browser verification (2026-10-29)
of the overlay's user-visible behaviour — reasoning auto-expand, compaction
progress and settled row, persistence across reload — served from the patched
tree in an isolated runtime; the built-artifact replay itself remains failing
on the pre-existing golden mismatch.
The alpha.2 port re-landed eight rejected hunks on the
current chat structure (`AssistantMarkdown.tsx`, `AssistantNodeView.tsx`,
`ChatFlow.tsx`, `ReasoningRow.tsx`, and the two specs) and extended the two
new locale keys to all eight dictionaries, which alpha.2's locale completeness
check requires.

`patches/dsh-v0.2.1-rc.2.patch` reproduces the fixed rc.2 tree: applying it on
that tag checkout yields the tree the verification record describes, originally
recorded as `85c0b8631d`. Only the client chat UI changed; the server-side
compaction protocol and durable records are unchanged. The 0.2.1-rc.1 patch was
retired when the rc.2 patch landed. (Do not confuse 0.2.1-rc.1 with
`dsh-v0.2.2-rc.1`, which is a later tag and has its own patch below.)

The `alpha3-overlay`, `rc1-overlay`, and `rc2-overlay` branches were retired on
2026-11-05: each hosted a full DSH tree, which made the remote's audit surface
far larger than the patch files that are the actual deliverable. The patch files
in `patches/` remain the record; the tree SHAs in this README and in
`patches/evidence/VERIFICATION.md` stay as historical identifiers and are no
longer fetchable.

## Apply

```sh
git clone --depth 1 https://github.com/Wepoi9/dsh-reasoning-compaction.git
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
git checkout dsh-v0.2.2-alpha.2
git apply --check ../dsh-reasoning-compaction/patches/dsh-v0.2.2-alpha.2.patch
git apply ../dsh-reasoning-compaction/patches/dsh-v0.2.2-alpha.2.patch
```

Both clones sit side by side: the patch files live in this repository, not in
the upstream checkout, so the `../dsh-reasoning-compaction/` paths in
the `git apply` commands are required.

Each patch targets exactly one tag. The alpha.2 and rc.2 patches do not apply on
`dsh-v0.2.2-rc.1`; that tag has its own patch, and the behavior it adds is not in
upstream.

## Build and run

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm run build
pnpm dsh web
```

The repository pins `pnpm@11.28.5` via `packageManager` and uses `workspace:*`
dependencies, so `npm install` cannot resolve the workspace. rc.2's client
typecheck (`tsc -b tsconfig.client.json`) needs the generated Typert
declarations that `pnpm run build` produces; run it after the build. Full
project documentation lives in the upstream repository and at
<https://deepseek-harness.github.io/deepseek-harness/>.

## Verification and known failures

`patches/evidence/VERIFICATION.md` is the rc.2 verification record; its
results do not describe alpha.2. Alpha.2-specific checks and non-passing
broader/browser runs are recorded in
[`patches/evidence/VERIFICATION-dsh-v0.2.2-alpha.2.md`](patches/evidence/VERIFICATION-dsh-v0.2.2-alpha.2.md).
The rc.2 web-e2e failures itemized in `VERIFICATION.md` are host-environment
items (missing WebKit executable, shared skills catalog injected into the
slash-menu candidates and persisted-replay snapshot, a Windows path separator
in one golden, one replayed-stream timeout), not UI regressions; the focused
rc.2 lane was rerun in full on the final tree under unified conditions and
produced no failure outside that itemized list. The hero first-prompt spec
passed on the rc.2 lane.

## License

MIT — same as upstream; see `LICENSE`.
