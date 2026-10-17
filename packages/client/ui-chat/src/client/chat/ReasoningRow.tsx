/** Assistant reasoning disclosure, independent of Tool-call presentation. */
import { memo, useEffect, useMemo, useRef } from 'react'
import { DisclosureRow, IconThinkOutlineRegular, TextShimmer } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsRenderSlots } from '@deepseek-ai/dsh-client-ui-slots'
import type { ChatViewSlotProps, UseDisclosure, UsePresentation } from '../contract/slots.ts'
import a11yCss from './accessibility.module.css'
import css from './ReasoningRow.module.css'

const THINK_ICON = <IconThinkOutlineRegular size={14} />

function firstLine(text: string): string {
  const newline = text.indexOf('\n')
  return newline === -1 ? text : text.slice(0, newline)
}

function latestCompletedParagraphFirstLine(text: string): string {
  let summary = ''
  let paragraphStart = 0
  const separator = /\r?\n(?:[\t ]*\r?\n)+/g
  while (true) {
    const nextParagraph = separator.exec(text)
    const paragraphEnd = nextParagraph === null ? text.length
      : nextParagraph.index + nextParagraph[0].indexOf('\n')
    const newline = text.indexOf('\n', paragraphStart)
    if (newline !== -1 && newline <= paragraphEnd) {
      const candidate = text.slice(paragraphStart, newline).trim()
      if (candidate !== '') summary = candidate
    }
    if (nextParagraph === null) return summary
    paragraphStart = nextParagraph.index + nextParagraph[0].length
  }
}

/**
 * Render one assistant reasoning block collapsed until the reader opens it. The
 * collapsed summary omits double-asterisk markers; expanded content renders
 * the complete Markdown with secondary typography. A streaming preview advances
 * when a paragraph's first line completes. Mode changes toggle CSS display without unmounting
 * collapsed summaries.
 * @param props.text - complete or streaming reasoning text.
 * @param props.running - whether this block is the streaming tail.
 * @param props.generationLive - whether the owning Session is generating now;
 *   defaults to true, and an orphaned running tail renders settled preview while false.
 * @param props.usePresentation - live display-policy selector for this reasoning row.
 * @param props.useDisclosure - independent open state with enclosing-Turn resets.
 * @param props.renderSlot - framework renderer for the standard reasoning Body Slot.
 * @param props.t - conversation locale seat for the disclosure and running status.
 * @returns the reasoning disclosure.
 */
export const ReasoningRow = memo(function ReasoningRow({ text, running, generationLive = true, usePresentation,
  useDisclosure, renderSlot, t }: {
    text: string
    running: boolean
    generationLive?: boolean
    useDisclosure: UseDisclosure
    usePresentation: UsePresentation
    t: ChatViewSlotProps['t']
  } & Pick<PropsRenderSlots<'conversation.chat.reasoning.body'>, 'renderSlot'>) {
  const { expanded, toggle, setExpanded } = useDisclosure()
  // Live streaming chrome is generation chrome: while the owning Session is
  // not generating, an orphaned running tail carries no live state and shows
  // settled summary preview instead.
  const live = running && generationLive
  const summaryText = live ? latestCompletedParagraphFirstLine(text) : firstLine(text)
  const summary = useMemo(() => summaryText.replaceAll('**', ''), [summaryText])
  const preview = usePresentation(policy => !expanded && summary !== ''
    && (live || policy.settledReasoningPreview))
  const collapsedContent = useMemo(() => (
    <>
      <span className={css.separator} data-shimmer-decoration aria-hidden />
      <span className={css.summary} data-streaming={live || undefined}>
        <span className={css.summaryText}>
          <TextShimmer>{summary}</TextShimmer>
        </span>
      </span>
    </>
  ), [live, summary])
  const content = useMemo(() => expanded ? (
    <div className={css.thinkBody}>
      {renderSlot('conversation.chat.reasoning.body', { text, running: live })}
    </div>
  ) : undefined, [expanded, renderSlot, live, text])

  // Auto-expand whenever a generating block carries body and it has not
  // expanded yet — including the first render: DSH batches reasoning diffs,
  // so body may already exist when the row first paints. A manual close is
  // then respected; settled blocks loading with body stay collapsed.
  const bodyArrived = useRef(false)
  useEffect(() => {
    const hasBody = text.trim().length > 0
    if (!live || !hasBody || bodyArrived.current) {
      bodyArrived.current = hasBody
      return
    }
    bodyArrived.current = true
    setExpanded(true)
  }, [live, text, setExpanded])
  // A settled block with no body has lost its generation condition; render no
  // empty Thinking row rather than leaving a blank heading behind — the same
  // holds for an orphaned tail whose Session no longer generates.
  if (!live && text.trim().length === 0) return null

  return (
    <div
      className={css.root}
      data-variant="think"
      data-state={live ? 'running' : 'ok'}
      data-expanded={expanded || undefined}
      data-preview={preview || undefined}
    >
      {live && <span className={a11yCss.visuallyHidden}>{t('row.running')}</span>}
      <DisclosureRow
        rowClassName={css.row}
        leadingClassName={css.leading}
        titleClassName={css.title}
        icon={THINK_ICON}
        title={t('message.think')}
        running={live}
        open={expanded}
        expandable
        expandOnRowClick
        onToggle={toggle}
        collapsedContent={collapsedContent}
      >
        {content}
      </DisclosureRow>
    </div>
  )
})
