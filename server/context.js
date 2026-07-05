const SUPPORTED_ROLES = new Set(['user', 'assistant'])
const DEFAULT_RECENT_LIMIT = 12
const DEFAULT_SUMMARY_LIMIT = 10
const DEFAULT_SUMMARY_CHARS = 1600

export function cleanMessages(messages = []) {
  if (!Array.isArray(messages)) {
    return []
  }

  return messages
    .filter((message) => SUPPORTED_ROLES.has(message?.role))
    .map((message) => ({
      role: message.role,
      content: String(message.content || '').trim()
    }))
    .filter((message) => message.content.length > 0)
}

export function trimMessages(messages = [], limit = DEFAULT_RECENT_LIMIT) {
  return cleanMessages(messages).slice(-limit)
}

function clipText(value, limit) {
  if (value.length <= limit) {
    return value
  }

  return `${value.slice(0, limit - 3).trim()}...`
}

function formatSummaryLine(message) {
  const speaker = message.role === 'user' ? 'User' : 'Assistant'

  return `- ${speaker}: ${clipText(message.content, 220)}`
}

export function summarizeOlderMessages(
  messages = [],
  {
    recentLimit = DEFAULT_RECENT_LIMIT,
    summaryLimit = DEFAULT_SUMMARY_LIMIT,
    maxChars = DEFAULT_SUMMARY_CHARS
  } = {}
) {
  const clean = cleanMessages(messages)
  const olderMessages = clean.slice(0, Math.max(0, clean.length - recentLimit))

  if (olderMessages.length === 0) {
    return ''
  }

  const selectedMessages = olderMessages.slice(-summaryLimit)
  const omittedCount = olderMessages.length - selectedMessages.length
  const lines = selectedMessages.map(formatSummaryLine)
  const summary = [
    omittedCount > 0 ? `${omittedCount} earlier message(s) came before this recap.` : '',
    ...lines
  ]
    .filter(Boolean)
    .join('\n')

  return clipText(summary, maxChars)
}

export function buildConversationContext(messages = [], options = {}) {
  const clean = cleanMessages(messages)

  return {
    messages: clean,
    recentMessages: clean.slice(-(options.recentLimit || DEFAULT_RECENT_LIMIT)),
    earlierSummary: summarizeOlderMessages(clean, options)
  }
}
