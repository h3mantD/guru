export async function fetchPersonas() {
  const response = await fetch('/api/personas')

  if (!response.ok) {
    throw new Error('Could not load personas.')
  }

  const data = await response.json()
  return data.personas
}

export async function sendChatMessage({ personaId, messages, answerDepth }) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ personaId, messages, answerDepth })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Could not generate a reply.')
  }

  return data.reply
}

export async function fetchVideoRecommendations({ personaId, messages }) {
  const response = await fetch('/api/youtube/recommendations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ personaId, messages })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Could not load video recommendations.')
  }

  return data
}

export async function fetchCreatorVideoDetails({ personaId, videoUrl, videoId }) {
  const response = await fetch('/api/youtube/video-details', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ personaId, videoUrl, videoId })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Could not load video details.')
  }

  return data.video
}
