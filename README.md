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
  row titled by status — a compacting/summarizing title while running and a
  summary-generation-failure title once failed — so a row never carries the
  completed label while its summary is missing; completed and manual
  `/compact` rows keep the existing shared title and the Trajectory views keep
  their existing behaviour. The row is built only for a Turn-anchored start
  whose Turn has not closed, and only while the session is running, so an
  interrupted run left behind by a closed Turn never shows as in-progress
  during a later Turn. Reloads of unfinished history stay free of stale
  running rows.

Supported upstream version: tag `dsh-v0.2.1-alpha.2` (commit `d7432673`).
`patches/dsh-v0.2.1-alpha.2.patch` reproduces the fixed tree: it passes
`git apply --check` and applies cleanly on that tag checkout. Only the client
chat UI changed; the server-side compaction protocol and durable records are
unchanged.

## Apply

```sh
git clone --depth 1 https://github.com/Wepoi9/hermes-dsh-reasoning-compaction.git
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
git checkout dsh-v0.2.1-alpha.2
git apply --check ../hermes-dsh-reasoning-compaction/patches/dsh-v0.2.1-alpha.2.patch
git apply ../hermes-dsh-reasoning-compaction/patches/dsh-v0.2.1-alpha.2.patch
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
dependencies, so `npm install` cannot resolve the workspace. Full project
documentation lives in the upstream repository and at
<https://deepseek-harness.github.io/deepseek-harness/>.

## Verification and known failures

`patches/evidence/VERIFICATION.md` records the unit-test, typecheck, build,
patch-application, and real-Chromium web-e2e results with each failure's
attribution. The web-e2e failures itemized there are host-environment items
(missing WebKit executable, shared skills catalog injected into seeded
sessions, a Windows path separator in one golden, one replayed-stream
timeout), not UI regressions; failures outside that itemized list are recorded
there as unattributed, not as confirmed environment-only. The hero
first-prompt spec is aligned with the auto-expand behaviour and its rerun
passes.

## License

MIT — same as upstream; see `LICENSE`.
