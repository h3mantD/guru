const QUICK_ACTIONS = {
  simpler: (topic) => `Explain this more simply: ${topic}`,
  example: (topic) => `Give me a real-world example for this: ${topic}`,
  code: (topic) => `Show a small code example for this: ${topic}`,
  quiz: (topic) => `Give me a short quiz to check my understanding of this: ${topic}`
}

const WELCOME_MESSAGES = {
  hitesh: {
    short:
      'Hanji, doubt bhejo. Seedha basic pakadte hain, phir chhota example.',
    normal:
      'Hanji, kya atka hai? Pehle basic clear karte hain, phir code ya example se pakka karenge.',
    deep:
      'Hanji, topic lao. Pehle foundation, phir example, galtiyan, trade-offs, aur end mein practice.'
  },
  piyush: {
    short:
      'Send the topic. Problem kya hai, flow kya hai, next step kya hai.',
    normal:
      'What are we building or debugging? Pehle flow set karte hain, phir implementation.',
    deep:
      'Share the problem statement. Flow, architecture, trade-offs, debugging, validation - ek-ek karke.'
  }
}

const YOUTUBE_URL_PATTERN = /https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/[^\s<>"')]+/i
const VIDEO_DETAIL_INTENT_PATTERN =
  /\b(detail|details|about|explain|summary|summarize|describe|review|analyze|analyse|critique|what is|what's|context|break down)\b/i

function cleanUrlMatch(url) {
  return url.replace(/[.,!?;:]+$/u, '')
}

function formatDuration(duration) {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/u.exec(duration || '')

  if (!match) {
    return ''
  }

  const [, hours = '0', minutes = '0', seconds = '0'] = match
  const parts = []

  if (Number(hours) > 0) {
    parts.push(`${Number(hours)}h`)
  }

  if (Number(minutes) > 0) {
    parts.push(`${Number(minutes)}m`)
  }

  if (Number(seconds) > 0 || parts.length === 0) {
    parts.push(`${Number(seconds)}s`)
  }

  return parts.join(' ')
}

function formatViewCount(viewCount) {
  const count = Number(viewCount)

  if (!Number.isFinite(count)) {
    return ''
  }

  if (count >= 1_000_000) {
    return `${Number((count / 1_000_000).toFixed(1))}M views`
  }

  if (count >= 1_000) {
    return `${Number((count / 1_000).toFixed(1))}K views`
  }

  return `${count} views`
}

export function buildQuickActionMessage(actionId, topic) {
  const cleanTopic = topic?.trim() || 'the current topic'
  const buildMessage = QUICK_ACTIONS[actionId]

  if (!buildMessage) {
    throw new Error(`Unknown quick action: ${actionId}`)
  }

  return buildMessage(cleanTopic)
}

export function extractYouTubeUrl(content) {
  const match = content?.match(YOUTUBE_URL_PATTERN)
  return match ? cleanUrlMatch(match[0]) : ''
}

export function wantsCreatorVideoDetails(content) {
  return Boolean(extractYouTubeUrl(content) && VIDEO_DETAIL_INTENT_PATTERN.test(content))
}

export function formatVideoDetailsReply(video) {
  const metadata = [video.channelTitle, formatDuration(video.duration), formatViewCount(video.viewCount)]
    .filter(Boolean)
    .join(' · ')
  const description = video.description?.trim()
  const shortDescription =
    description && description.length > 260 ? `${description.slice(0, 257).trim()}...` : description
  const tags = Array.isArray(video.tags) ? video.tags.slice(0, 6).join(', ') : ''

  return [
    `Verified creator video: **${video.title}**`,
    metadata ? `\n${metadata}` : '',
    '\nI can review the YouTube metadata for this video. A full content review needs the transcript or video text because the YouTube API does not return the spoken lesson.',
    shortDescription ? `\nWhat the metadata says: ${shortDescription}` : '',
    tags ? `\nTopic signals: ${tags}` : '',
    video.url ? `\nOpen video: ${video.url}` : ''
  ]
    .filter(Boolean)
    .join('\n')
}

export function getWelcomeMessage({ personaId, depth }) {
  return (
    WELCOME_MESSAGES[personaId]?.[depth] ||
    WELCOME_MESSAGES[personaId]?.normal ||
    WELCOME_MESSAGES.hitesh.normal
  )
}

export function getDepthLabel(depth) {
  if (depth === 'short') return 'Short'
  if (depth === 'deep') return 'Deep'
  return 'Normal'
}
