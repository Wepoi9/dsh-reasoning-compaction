// Automatic compaction has no owning slash Command; its shared compaction
// evidence is adopted as Definition-owned State beside the Command Definition.

import type { Context } from '@deepseek-ai/cordis'
import type {
  CompactionSummaryNode, ConversationMatch, ConversationNodeContext, ConversationNodeDefinition,
  ConversationStartMatch,
} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { CompactionProgressNode } from '../contract/chat-nodes.ts'
import { chatNode } from './common.ts'
import { compactSource, compactSummary, updateCompactionState } from './command.ts'

/**
 * Whether this automatic-compaction Context's start anchors a live Turn.
 * Automatic compaction runs inside a generating Turn, so its start event
 * carries that Turn; a checkpoint-less start whose run produced neither a
 * replacement nor an error-carrying end keeps its row only while that Turn
 * is not closed. A start whose Turn a durable turn/end already closed is
 * history, never a live run — rendering it in a later generating Turn would
 * mislabel an interrupted run as in-progress compaction. A session-level
 * start with no Turn (the legacy auto-compaction shape that a Turn-end event
 * terminates) and an unresolved start are likewise history. Live running
 * itself is confirmed separately by the renderer, which hides this row while
 * the Session is not running.
 */
function startCarriesTurn(start: ConversationStartMatch): boolean {
  const location = start.location
  return location.kind !== 'session' && location.kind !== 'unresolved'
    && location.turn.status !== 'closed'
}

declare module '../contract/chat-nodes.ts' {
  interface ChatNodeDataMap {
    /**
     * Automatic compaction: the finalized checkpoint, or the in-progress or
     * failed row kept for a Turn-anchored start without a terminal event.
     */
    compaction: CompactionSummaryNode | CompactionProgressNode
  }
}

/**
 * Compaction events already collected for one automatic-compaction Context.
 * `summary` is null for an auto-fired (non-command) run; `checkpoint` is the
 * replacement surface event that finalizes the run; `end` is the optional
 * lifecycle end, whose error renders the failed row.
 */
interface CompactionState {
  readonly summary?: ConversationMatch
  readonly checkpoint?: ConversationMatch
  readonly end?: ConversationMatch
}

function fallbackState(context: ConversationNodeContext<CompactionState>): CompactionState {
  const checkpoint = context.matches.find(match => compactSource(match.event) !== undefined)
  const summary = context.matches.find(match => match.event.type === 'compaction/summary')
  const end = context.matches.find(match => match.event.type === 'compaction/end')
  return {
    ...checkpoint === undefined ? {} : { checkpoint },
    ...summary === undefined ? {} : { summary },
    ...end === undefined ? {} : { end },
  }
}

/** Automatic system compaction lifecycle and its standalone summary marker. */
export const compactionDefinition: ConversationNodeDefinition<CompactionState> = {
  kind: 'compaction',
  target: 'chat',
  match: (event) => {
    const checkpoint = compactSource(event)
    if (checkpoint !== undefined) {
      return checkpoint.sourceCommandId === undefined
        ? { id: String(checkpoint.compactionId), role: 'update' }
        : null
    }
    if (event.type === 'compaction/start'
      || event.type === 'compaction/summary'
      || event.type === 'compaction/end') {
      const compactionId = event.data.compactionId
      if (compactionId === undefined
        || event.data.sourceCommandId !== undefined
        || typeof compactionId !== 'string') {
        return null
      }
      return { id: compactionId, role: event.type === 'compaction/start' ? 'start' : 'update' }
    }
    return null
  },
  start: () => ({}),
  update: (context, match) => (match.event.type === 'compaction/end'
    ? { ...context.state, end: match }
    : updateCompactionState(context.state, match)),
  buildViewNode: (context) => {
    const state = context.state ?? fallbackState(context)
    const marker = state?.checkpoint === undefined
      ? undefined
      : compactSummary(state?.summary, state?.checkpoint)
    if (marker !== undefined) {
      return chatNode(context, 'compaction', marker.seq, marker)
    }
    const end = state?.end
    const endPayload = end?.event.data as { readonly error?: unknown } | undefined
    // A landed checkpoint owns the completed marker above; an error without one
    // ends the run as one failed row, and an interruption leaves no row at all.
    if (end !== undefined && endPayload?.error !== undefined) {
      const data: CompactionProgressNode = {
        kind: 'compaction',
        status: 'failed',
        seq: end.event.seq,
        time: end.event.time,
        message: typeof endPayload.error === 'string' ? endPayload.error : undefined,
      }
      return chatNode(context, 'compaction', data.seq, data)
    }
    const start = context.start
    // The running row requires its own start event in the loaded window and a
    // Turn-anchored start whose Turn has not closed; a summary whose start
    // escaped to another window stays a partial summary, a legacy session-level
    // start — one a Turn-end event used to terminate — leaves no row, and a
    // Turn already closed by a durable turn/end is history, not a live run.
    // The renderer additionally hides the row while the Session is not
    // running.
    if (end === undefined && start !== undefined && state?.checkpoint === undefined
      && startCarriesTurn(start)) {
      const data: CompactionProgressNode = {
        kind: 'compaction',
        status: 'running',
        seq: start.event.seq,
        time: start.event.time,
      }
      return chatNode(context, 'compaction', data.seq, data)
    }
    return null
  },
}

/**
 * Register the automatic-compaction business contribution.
 * @param ctx - owning UI Conversation context.
 */
export function registerCompactionConversationNode(ctx: Context): void {
  ctx.uiConversation.events.register(compactionDefinition)
}
