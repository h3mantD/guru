const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3'

const PERSONA_CHANNELS = {
  hitesh: {
    handles: ['@HiteshCodeLab', '@chaiaurcode'],
    fallbackKeywords: ['javascript', 'ai', 'devops', 'dsa', 'sql']
  },
  piyush: {
    handle: '@piyushgargdev',
    fallbackKeywords: ['backend', 'system design', 'full stack']
  }
}

const TECH_KEYWORDS = [
  'ai',
  'agent',
  'api',
  'aws',
  'backend',
  'cache',
  'cloud',
  'database',
  'deployment',
  'devops',
  'docker',
  'dsa',
  'express',
  'frontend',
  'full stack',
  'auth',
  'authentication',
  'javascript',
  'jwt',
  'kubernetes',
  'node',
  'observability',
  'postgres',
  'queue',
  'queues',
  'react',
  'redis',
  's3',
  'session',
  'sql',
  'system design',
  'testing',
  'typescript',
  'voip',
  'websocket'
]

function getApiKey(apiKey = process.env.YT_API_KEY) {
  if (!apiKey) {
    throw new Error('YT_API_KEY is missing. Add it to your .env file.')
  }

  return apiKey
}

function getPersonaConfig(personaId) {
  const config = PERSONA_CHANNELS[personaId]

  if (!config) {
    throw new Error(`Unknown persona: ${personaId}`)
  }

  return config
}

function getPersonaHandles(config) {
  return config.handles || [config.handle]
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function findKeywordPosition(text, keyword) {
  const pattern = new RegExp(`(^|\\W)${escapeRegExp(keyword)}(\\W|$)`, 'i')
  const match = text.match(pattern)

  if (!match || match.index === undefined) {
    return -1
  }

  return match.index + (match[1] ? match[1].length : 0)
}

function buildYouTubeUrl(path, params) {
  const url = new URL(`${YOUTUBE_API_BASE_URL}/${path}`)

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })

  return url
}

async function readYouTubeJson(response) {
  const data = await response.json()

  if (!response.ok) {
    const message = data?.error?.message || 'YouTube request failed.'
    throw new Error(message)
  }

  return data
}

async function fetchChannelId({ handle, apiKey, fetchImpl = fetch }) {
  const url = buildYouTubeUrl('channels', {
    part: 'id',
    forHandle: handle,
    key: getApiKey(apiKey)
  })
  const data = await readYouTubeJson(await fetchImpl(url))
  const channelId = data.items?.[0]?.id

  if (!channelId) {
    throw new Error(`Could not find YouTube channel for handle: ${handle}`)
  }

  return channelId
}

async function fetchChannelIds({ config, apiKey, fetchImpl = fetch }) {
  return Promise.all(
    getPersonaHandles(config).map((handle) =>
      fetchChannelId({
        handle,
        apiKey,
        fetchImpl
      })
    )
  )
}

async function searchChannelVideos({
  apiKey,
  channelId,
  query,
  maxResults = 4,
  order = 'relevance',
  fetchImpl = fetch
}) {
  const url = buildYouTubeUrl('search', {
    part: 'snippet',
    channelId,
    q: query,
    type: 'video',
    order,
    maxResults,
    key: getApiKey(apiKey)
  })
  const data = await readYouTubeJson(await fetchImpl(url))

  return (data.items || []).map(normalizeYouTubeVideo).filter(Boolean)
}

async function fetchVideosById({ apiKey, videoIds, fetchImpl = fetch }) {
  if (!videoIds.length) {
    return []
  }

  const url = buildYouTubeUrl('videos', {
    part: 'snippet,contentDetails,statistics',
    id: videoIds.join(','),
    key: getApiKey(apiKey)
  })
  const data = await readYouTubeJson(await fetchImpl(url))

  return (data.items || []).map(normalizeYouTubeVideoDetails).filter(Boolean)
}

export function normalizeYouTubeVideo(item) {
  const videoId = item?.id?.videoId

  if (!videoId) {
    return null
  }

  const thumbnailUrl =
    item.snippet?.thumbnails?.high?.url ||
    item.snippet?.thumbnails?.medium?.url ||
    item.snippet?.thumbnails?.default?.url ||
    ''

  return {
    videoId,
    title: item.snippet?.title || 'Untitled video',
    channelTitle: item.snippet?.channelTitle || 'YouTube',
    publishedAt: item.snippet?.publishedAt || '',
    thumbnailUrl,
    url: `https://www.youtube.com/watch?v=${videoId}`
  }
}

export function normalizeYouTubeVideoDetails(item) {
  const videoId = item?.id?.videoId || item?.id

  if (!videoId) {
    return null
  }

  const thumbnailUrl =
    item.snippet?.thumbnails?.high?.url ||
    item.snippet?.thumbnails?.medium?.url ||
    item.snippet?.thumbnails?.default?.url ||
    ''

  return {
    videoId,
    title: item.snippet?.title || 'Untitled video',
    description: item.snippet?.description || '',
    channelId: item.snippet?.channelId || '',
    channelTitle: item.snippet?.channelTitle || 'YouTube',
    publishedAt: item.snippet?.publishedAt || '',
    thumbnailUrl,
    tags: item.snippet?.tags || [],
    duration: item.contentDetails?.duration || '',
    viewCount: item.statistics?.viewCount || '',
    url: `https://www.youtube.com/watch?v=${videoId}`
  }
}

export function extractYouTubeVideoId(value = '') {
  const rawValue = String(value).trim()

  if (/^[a-zA-Z0-9_-]{11}$/.test(rawValue)) {
    return rawValue
  }

  try {
    const url = new URL(rawValue)

    if (url.hostname.includes('youtu.be')) {
      return url.pathname.split('/').filter(Boolean)[0] || ''
    }

    if (url.hostname.includes('youtube.com')) {
      const watchId = url.searchParams.get('v')
      if (watchId) return watchId

      const parts = url.pathname.split('/').filter(Boolean)
      const videoPathIndex = parts.findIndex((part) =>
        ['shorts', 'embed', 'live'].includes(part)
      )

      if (videoPathIndex >= 0) {
        return parts[videoPathIndex + 1] || ''
      }
    }
  } catch (error) {
    return ''
  }

  return ''
}

function buildKeyContext(messages = []) {
  return messages
    .filter((message) => ['user', 'assistant'].includes(message?.role))
    .map((message) => message.content || '')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(-1200)
    .toLowerCase()
}

export function extractChatIntent(messages = [], personaId) {
  const keyContext = buildKeyContext(messages)

  const uniqueKeywords = TECH_KEYWORDS
    .map((keyword) => ({
      keyword,
      position: findKeywordPosition(keyContext, keyword)
    }))
    .filter((item) => item.position >= 0)
    .sort((first, second) => first.position - second.position)
    .map((item) => item.keyword)

  if (uniqueKeywords.length > 0) {
    return {
      query: uniqueKeywords.join(' '),
      keywords: uniqueKeywords,
      keyContext
    }
  }

  const fallbackKeywords = PERSONA_CHANNELS[personaId]?.fallbackKeywords || ['coding', 'software']

  return {
    query: fallbackKeywords.join(' '),
    keywords: fallbackKeywords,
    keyContext
  }
}

export function getVideoRelevance(video, intent) {
  const searchableText = [
    video.title,
    video.description,
    ...(video.tags || [])
  ]
    .join(' ')
    .toLowerCase()

  const matchedKeywords = intent.keywords.filter((keyword) =>
    findKeywordPosition(searchableText, keyword) >= 0
  )

  return {
    score: matchedKeywords.length,
    matchedKeywords
  }
}

export async function fetchLatestPersonaVideos({ apiKey, maxResults = 4, fetchImpl = fetch } = {}) {
  const resolvedApiKey = getApiKey(apiKey)
  const entries = await Promise.all(
    Object.entries(PERSONA_CHANNELS).map(async ([personaId, config]) => {
      const channelIds = await fetchChannelIds({
        config,
        apiKey: resolvedApiKey,
        fetchImpl
      })
      const channelVideos = await Promise.all(
        channelIds.map((channelId) =>
          searchChannelVideos({
            apiKey: resolvedApiKey,
            channelId,
            maxResults,
            order: 'date',
            fetchImpl
          })
        )
      )
      const videos = channelVideos
        .flat()
        .sort((first, second) => new Date(second.publishedAt) - new Date(first.publishedAt))
        .slice(0, maxResults)

      return [personaId, videos]
    })
  )

  return Object.fromEntries(entries)
}

export async function fetchRecommendedVideos({
  apiKey,
  personaId,
  messages,
  maxResults = 4,
  fetchImpl = fetch
}) {
  const resolvedApiKey = getApiKey(apiKey)
  const config = getPersonaConfig(personaId)
  const intent = extractChatIntent(messages, personaId)
  const channelIds = await fetchChannelIds({
    config,
    apiKey: resolvedApiKey,
    fetchImpl
  })
  const searchResults = await Promise.all(
    channelIds.map((channelId) =>
      searchChannelVideos({
        apiKey: resolvedApiKey,
        channelId,
        query: intent.query,
        maxResults: Math.max(maxResults * 2, 8),
        fetchImpl
      })
    )
  )
  const videos = searchResults.flat()
  const videoIds = [...new Set(videos.map((video) => video.videoId))]
  const detailedVideos = await fetchVideosById({
    apiKey: resolvedApiKey,
    videoIds,
    fetchImpl
  })
  const allowedChannelIds = new Set(channelIds)
  const relevantVideos = detailedVideos
    .filter((video) => allowedChannelIds.has(video.channelId))
    .map((video) => {
      const relevance = getVideoRelevance(video, intent)

      return {
        ...video,
        relevanceScore: relevance.score,
        matchedKeywords: relevance.matchedKeywords
      }
    })
    .filter((video) => video.relevanceScore > 0)
    .sort((first, second) => second.relevanceScore - first.relevanceScore)
    .slice(0, maxResults)

  return {
    personaId,
    intent,
    videos: relevantVideos
  }
}

export async function fetchCreatorVideoDetails({
  apiKey,
  personaId,
  videoId,
  videoUrl,
  fetchImpl = fetch
}) {
  const resolvedApiKey = getApiKey(apiKey)
  const config = getPersonaConfig(personaId)
  const resolvedVideoId = videoId || extractYouTubeVideoId(videoUrl)

  if (!resolvedVideoId) {
    throw new Error('Please provide a valid YouTube video URL or ID.')
  }

  const channelIds = await fetchChannelIds({
    config,
    apiKey: resolvedApiKey,
    fetchImpl
  })
  const videos = await fetchVideosById({
    apiKey: resolvedApiKey,
    videoIds: [resolvedVideoId],
    fetchImpl
  })
  const video = videos[0]

  if (!video) {
    throw new Error('Could not find that YouTube video.')
  }

  if (!channelIds.includes(video.channelId)) {
    throw new Error('That video is not from the selected creator channel.')
  }

  return video
}
