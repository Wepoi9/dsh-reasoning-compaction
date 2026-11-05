# DSH 0.2.2-rc.1: the overlay is required

Checked on 2026-11-05 against tag `dsh-v0.2.2-rc.1` (commit `66491b05e3`).

This file replaces an earlier record (`RC1-NATIVE.md`) that claimed upstream already
shipped both behaviors. That record was wrong: its file/line list described the
overlay's own code, read from a working tree that already had the patch applied.

## Upstream 0.2.2-rc.1 has neither behavior

Every check below reads tag content directly (`git show <tag>:<path>` or a clean
worktree), so a patched tree cannot leak into the result.

```
$ git grep -l 'generationLive' dsh-v0.2.2-rc.1 -- packages/client
(no output: 0 files)

$ git grep -l 'CompactionProgressNode' dsh-v0.2.2-rc.1 -- packages/client
(no output: 0 files)

$ git show dsh-v0.2.2-rc.1:packages/client/ui-chat/src/client/chat/ReasoningRow.tsx \
    | grep -c -E 'generationLive|useEffect|setExpanded'
0                                  # 112-line file, none of the three symbols

$ git show dsh-v0.2.2-rc.1:packages/client/ui-chat/src/client/contract/chat-nodes.ts \
    | grep -c 'CompactionProgressNode'
0
```

At that tag `ReasoningRow.tsx` normalizes reasoning with `reasoningText()` and
returns `null` when the display filter empties the text; it has no generating flag
and no auto-expand effect. `conversation-nodes/compaction.ts` (65 lines) declares
only `compaction: CompactionSummaryNode` in `ChatNodeDataMap` and builds no
progress row.

## "The alpha.2 patch does not apply" is not evidence of native support

`git apply --check patches/dsh-v0.2.2-alpha.2.patch` fails against the rc.1 tag on
several hunks (chat view, reasoning row, tests) because rc.1 rewrote the chat
structure: the reasoning Body Slot props gained `rawText`, and `fileMentions`
moved from `ChatNodeOwnerProps` to `AssistantNodeInjected`. A failed hunk means
the surrounding context moved; it says nothing about whether the behavior
arrived.

## The rc.1 overlay

`patches/dsh-v0.2.2-rc.1.patch` — 18 files.

```
$ git -C <clean dsh-v0.2.2-rc.1 checkout> apply --check patches/dsh-v0.2.2-rc.1.patch
$ echo $?
0
```

It also reverse-applies cleanly to the patched tree, so the file stays identical
to the diff it came from.

Five files needed manual conflict resolution. `ReasoningRow.tsx` keeps the
generating flag (`generationLive`) and the auto-expand effect, adds the overlay's
slot payload `{ rawText, text, running: live }`, and combines both empty-row
conditions into `hidden || (!live && text.trim().length === 0)`.
`AssistantNodeView.tsx`, `ChatFlow.tsx`, and `ChatNodeSeat.tsx` keep the
`running` owner prop while dropping `fileMentions`, which rc.1 moved to
`AssistantNodeInjected`. `contract/slots.ts` keeps `running` on
`ChatNodeOwnerProps` and drops `fileMentions` from it.

## rc.1 verification

- `pnpm run build:artifacts`: 8/8 gates, including the client compiler
  (72.13s, incremental after the base build).
- Focused ui-chat specs: `reasoning-row` 41, `chat-view` 181,
  `conversation-node-definitions` 97 — 319 passed.
- Isolated runtime (port 3081, patched tree): while the model streamed, the
  reasoning row reported `data-state="running"` / `data-expanded="true"` with
  294 characters of body; after the turn settled the row collapsed again.
- Production (port 3080, `0.2.2-rc.1`, commit `66491b0`): the served
  `dsh-client-ui-chat` bundle contains the added locale strings
  (`要約を生成中`, `Summarizing…`, `compaction.failed`), and an existing session
  transcript renders 173 `data-variant="think"` rows.

Not verified on rc.1: the compaction progress row itself (a compaction was not
forced on the production session) and the `failed` branch in a live browser.
Those rest on the focused specs only.

## Consequence

rc.1 needs this overlay. The alpha.2 and rc.2 patches stay as the history for
those lanes.
