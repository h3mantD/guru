const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3'

const PERSONA_CHANNELS = {
  hitesh: {
    handles: ['@HiteshCodeLab', '@chaiaurcode']
  },
  piyush: {
    handle: '@piyushgargdev'
  }
}

const TECH_KEYWORDS = [
  'ai',
  'agent',
  'api',
  'aws',
  'backend',
  'cache',
  'caching',
  'cdn',
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
  'socket',
  'sockets',
  'sql',
  'system design',
  'testing',
  'typescript',
  'voip',
  'websocket',
  'websockets'
]

const KEYWORD_EXPANSIONS = {
  cache: ['caching', 'redis', 'cdn'],
  caching: ['cache', 'redis', 'cdn'],
  socket: ['sockets', 'websocket', 'websockets'],
  sockets: ['socket', 'websocket', 'websockets'],
  websocket: ['websockets', 'socket', 'sockets', 'redis'],
  websockets: ['websocket', 'socket', 'sockets', 'redis']
}

const RECOMMENDATION_INTENT_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini'

function getApiKey(apiKey = process.env.YT_API_KEY) {
  if (!apiKey) {
    throw new Error('YT_API_KEY is missing. Add it to your .env file.')
  }

  return apiKey
}

function uniqueValues(values, limit = 8) {
  const unique = []

  values
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean)
    .forEach((value) => {
      if (!unique.includes(value)) {
        unique.push(value)
      }
    })

  return unique.slice(0, limit)
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

function buildRoleContext(messages = [], role) {
  return messages
    .filter((message) => message?.role === role)
    .map((message) => message.content || '')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(-1200)
    .toLowerCase()
}

function extractKeywordItems(text) {
  return TECH_KEYWORDS
    .map((keyword) => ({
      keyword,
      position: findKeywordPosition(text, keyword)
    }))
    .filter((item) => item.position >= 0)
    .sort((first, second) => first.position - second.position)
}

function expandKeywords(keywords) {
  const expanded = []

  keywords.forEach((keyword) => {
    if (!expanded.includes(keyword)) {
      expanded.push(keyword)
    }

    ;(KEYWORD_EXPANSIONS[keyword] || []).forEach((relatedKeyword) => {
      if (!expanded.includes(relatedKeyword)) {
        expanded.push(relatedKeyword)
      }
    })
  })

  return expanded
}

function parseJsonObject(value = '') {
  try {
    return JSON.parse(value)
  } catch (error) {
    const match = String(value).match(/\{[\s\S]*\}/u)

    if (!match) {
      return null
    }

    try {
      return JSON.parse(match[0])
    } catch (parseError) {
      return null
    }
  }
}

function normalizeAiVideoIntent(data, fallbackIntent) {
  if (!data || typeof data !== 'object') {
    return null
  }

  const searchQueries = uniqueValues(data.searchQueries || data.queries || [], 6)
  const requiredTerms = uniqueValues(data.requiredTerms || data.keywords || [], 10)
  const excludeTerms = uniqueValues(data.excludeTerms || [], 8)

  if (searchQueries.length === 0 && requiredTerms.length === 0) {
    return null
  }

  const keywords = uniqueValues([...requiredTerms, ...fallbackIntent.keywords], 12)
  const queries = searchQueries.length > 0 ? searchQueries : [keywords.join(' ')]

  return {
    ...fallbackIntent,
    source: 'ai',
    primaryTopic: String(data.primaryTopic || queries[0] || fallbackIntent.query).trim(),
    query: queries[0],
    queries,
    keywords,
    excludeTerms
  }
}

export async function generateVideoSearchIntent({
  openai,
  model = RECOMMENDATION_INTENT_MODEL,
  messages = [],
  fallbackIntent
} = {}) {
  if (!openai || fallbackIntent.keywords.length === 0) {
    return fallbackIntent
  }

  const response = await openai.responses.create({
    model,
    instructions: [
      'Generate YouTube search intent for finding relevant creator tutorial videos.',
      'Use only the supplied chat context and existing keywords.',
      'Return strict JSON with primaryTopic, searchQueries, requiredTerms, and excludeTerms.',
      'searchQueries must contain 3 to 6 concise YouTube search phrases.',
      'requiredTerms must contain 3 to 8 concrete topic terms that video title, description, or tags should match.',
      'Do not include broad creator/persona terms unless they are the actual topic.'
    ].join('\n'),
    input: [
      {
        role: 'user',
        content: JSON.stringify({
          existingKeywords: fallbackIntent.keywords,
          chatContext: fallbackIntent.keyContext,
          recentMessages: messages.slice(-8)
        })
      }
    ]
  })
  const parsedIntent = normalizeAiVideoIntent(
    parseJsonObject(response.output_text || ''),
    fallbackIntent
  )

  return parsedIntent || fallbackIntent
}

export function extractChatIntent(messages = [], personaId) {
  const keyContext = buildKeyContext(messages)
  const userContext = buildRoleContext(messages, 'user')
  const userKeywords = extractKeywordItems(userContext).map((item) => item.keyword)
  const allKeywords = extractKeywordItems(keyContext).map((item) => item.keyword)
  const baseKeywords = userKeywords.length > 0 ? userKeywords : allKeywords
  const uniqueKeywords = expandKeywords(baseKeywords)

  if (uniqueKeywords.length > 0) {
    return {
      source: 'deterministic',
      query: uniqueKeywords.join(' '),
      queries: [uniqueKeywords.join(' ')],
      keywords: uniqueKeywords,
      excludeTerms: [],
      keyContext
    }
  }

  return {
    source: 'deterministic',
    query: '',
    queries: [],
    keywords: [],
    excludeTerms: [],
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
  const excludedTerms = (intent.excludeTerms || []).filter((term) =>
    findKeywordPosition(searchableText, term) >= 0
  )

  return {
    score: excludedTerms.length > 0 ? 0 : matchedKeywords.length,
    matchedKeywords,
    excludedTerms
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
  fetchImpl = fetch,
  openai
}) {
  const resolvedApiKey = getApiKey(apiKey)
  const config = getPersonaConfig(personaId)
  const fallbackIntent = extractChatIntent(messages, personaId)
  let intent = fallbackIntent

  try {
    intent = await generateVideoSearchIntent({
      openai,
      messages,
      fallbackIntent
    })
  } catch (error) {
    intent = fallbackIntent
  }

  if (intent.keywords.length === 0) {
    return {
      personaId,
      intent,
      videos: []
    }
  }

  const searchQueries = intent.queries?.length ? intent.queries : [intent.query]
  const channelIds = await fetchChannelIds({
    config,
    apiKey: resolvedApiKey,
    fetchImpl
  })
  const searchResults = await Promise.all(
    channelIds.flatMap((channelId) =>
      searchQueries.map((query) =>
        searchChannelVideos({
          apiKey: resolvedApiKey,
          channelId,
          query,
          maxResults: Math.max(maxResults, 4),
          fetchImpl
        })
      )
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
