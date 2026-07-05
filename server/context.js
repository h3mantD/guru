const SUPPORTED_ROLES = new Set(['user', 'assistant'])

export function trimMessages(messages = [], limit = 12) {
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
    .slice(-limit)
}
