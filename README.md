# DSH reasoning auto-expand & automatic compaction progress — patch distribution

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
  row: the row is built only for a Turn-anchored start whose Turn has not
  closed, and only while the session is running, so an interrupted run left
  behind by a closed Turn never shows as in-progress during a later Turn.
  Reloads of unfinished history stay free of stale running rows. `/compact`
  markers and Trajectory views keep their existing behaviour.

Supported upstream version: tag `dsh-v0.2.1-alpha.3` (commit `2fbf4359b8`).
`patches/dsh-v0.2.1-alpha.3.patch` reproduces the fixed tree: after `git apply`
on that tag checkout, `git diff --exit-code d03d9c7fb4` against this
repository's `alpha3-overlay` branch tip is empty. Only the client chat UI
changed; the server-side compaction protocol and durable records are unchanged.
The source of the patch lives on the `alpha3-overlay` branch of this
repository, re-landed on the alpha.3 chat UI structure. The alpha.2 overlay was
retired with the alpha.3 patch; the alpha.2 tree lives on in this repository's
history.

## Apply

```sh
git clone --depth 1 https://github.com/Wepoi9/hermes-dsh-reasoning-compaction.git
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
git checkout dsh-v0.2.1-alpha.3
git apply --check ../hermes-dsh-reasoning-compaction/patches/dsh-v0.2.1-alpha.3.patch
git apply ../hermes-dsh-reasoning-compaction/patches/dsh-v0.2.1-alpha.3.patch
```

Both clones sit side by side: the patch files live in this repository, not in
the upstream checkout, so the `../hermes-dsh-reasoning-compaction/` paths in
the `git apply` commands are required.

## Build and run

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm run build
pnpm dsh web
```

The repository pins `pnpm@11.28.5` via `packageManager` and uses `workspace:*`
dependencies, so `npm install` cannot resolve the workspace. Alpha.3's client
typecheck (`tsc -b tsconfig.client.json`) needs the generated Typert
declarations that `pnpm run build` produces; run it after the build. Full
project documentation lives in the upstream repository and at
<https://deepseek-harness.github.io/deepseek-harness/>.

## Verification and known failures

`patches/evidence/VERIFICATION.md` records the unit-test, typecheck, build,
patch-application, and real-Chromium web-e2e results with each failure's
attribution. The web-e2e failures itemized there are host-environment items
(missing WebKit executable, shared skills catalog injected into the slash-menu
candidates and the persisted-replay snapshot, a Windows path separator in one
golden, one replayed-stream timeout), not UI regressions; the focused lane was
rerun in full on the final tree under unified conditions and produced no
failure outside that itemized list. The hero
first-prompt spec is aligned with the auto-expand behaviour and passes on the
alpha.3 lane.

## License

MIT — same as upstream; see `LICENSE`.
