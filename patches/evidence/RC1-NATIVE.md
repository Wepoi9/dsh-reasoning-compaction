# DSH 0.2.2-rc.1: the overlay is obsolete

Checked on 2026-11-05 against a checkout of tag `dsh-v0.2.2-rc.1`
(commit `66491b05e3`).

## Neither patch applies

```
$ git apply --check patches/dsh-v0.2.2-alpha.2.patch
error: patch failed: apps/web/tests/lifecycle-chrome.e2e.ts:349
error: apps/web/tests/lifecycle-chrome.e2e.ts: patch does not apply
error: patch failed: packages/client/ui-chat/src/client/chat/AssistantMarkdown.tsx:36
error: packages/client/ui-chat/src/client/chat/AssistantMarkdown.tsx: patch does not apply

$ git apply --check patches/dsh-v0.2.1-rc.2.patch
error: patch failed: apps/web/tests/lifecycle-chrome.e2e.ts:349
error: apps/web/tests/lifecycle-chrome.e2e.ts: patch does not apply
error: patch failed: packages/client/ui-chat/src/client/chat/AssistantMarkdown.tsx:36
error: packages/client/ui-chat/src/client/chat/AssistantMarkdown.tsx: patch does not apply
```

`git apply --check -p1` reports the same. The overlay's hunks target the
alpha.2 chat structure, which rc.1 has since rewritten; no hunk lands.

## rc.1 ships both behaviors natively

Reasoning auto-expand once per generation, respecting a manual close:

- `packages/client/ui-chat/src/client/chat/ReasoningRow.tsx:52` — `generationLive` prop, defaulted.
- `packages/client/ui-chat/src/client/chat/ReasoningRow.tsx:70` — `const live = running && generationLive`.
- `packages/client/ui-chat/src/client/chat/ReasoningRow.tsx:91-104` — expands when a generating block first carries body text, including the first render, and does not re-expand after a manual close.
- `packages/client/ui-chat/src/client/chat/AssistantMarkdown.tsx:41,62,109` and `chat/AssistantNodeView.tsx:55` — thread the generating flag down.

Automatic compaction progress as a display-only `running` / `failed` row:

- `packages/client/ui-chat/src/client/contract/chat-nodes.ts:68` — `CompactionProgressNode`.
- `packages/client/ui-chat/src/client/conversation-nodes/compaction.ts:98-109` — an error-bearing `compaction/end` without a checkpoint renders one `failed` row, not gated on the Session running.
- `packages/client/ui-chat/src/client/conversation-nodes/compaction.ts:110-127` — a `running` row requires its own start event in the loaded window and a Turn-anchored start whose Turn has not closed; a Session-level start or a closed Turn renders nothing, and the renderer hides the row while the Session is not running.
- `packages/client/ui-chat/src/client/chat/CompactionItem.tsx:13,18,32` — renders both node kinds.
- `packages/client/ui-chat/src/client/index.ts:27` — `CompactionProgressNode` exported from the client entry.

## Consequence

No rc.1 patch is published, and none is planned. On `dsh-v0.2.2-rc.1` the
two behaviors come from upstream, so applying this overlay would only conflict.
The alpha.2 and rc.2 patches and their verification records stay as the
history for those lanes.
