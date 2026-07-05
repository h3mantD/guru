import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { cleanMessages } from './context.js'
import { createChatService } from './chatService.js'
import { createOpenAIClient } from './openaiClient.js'
import { getPersona, listPersonas } from './personas.js'
import {
  fetchCreatorVideoDetails,
  fetchLatestPersonaVideos,
  fetchRecommendedVideos
} from './youtubeService.js'

const distPath = path.resolve(process.cwd(), 'dist')

export function createApp({ chatService, youtubeService } = {}) {
  const app = express()
  const activeChatService =
    chatService ||
    ((payload) => {
      const service = createChatService({
        openai: createOpenAIClient()
      })

      return service(payload)
    })
  const activeYouTubeService = youtubeService || {
    fetchCreatorVideoDetails,
    fetchLatestPersonaVideos,
    fetchRecommendedVideos
  }

  app.use(express.json({ limit: '1mb' }))

  app.get('/api/health', (req, res) => {
    res.json({ ok: true })
  })

  app.get('/api/personas', (req, res) => {
    res.json({ personas: listPersonas() })
  })

  app.post('/api/chat', async (req, res, next) => {
    try {
      const { personaId, messages, answerDepth } = req.body || {}
      getPersona(personaId)

      const sanitizedMessages = cleanMessages(messages)
      if (sanitizedMessages.length === 0) {
        return res.status(400).json({ error: 'Please send at least one message.' })
      }

      const reply = await activeChatService({
        personaId,
        messages: sanitizedMessages,
        answerDepth
      })

      res.json({ reply })
    } catch (error) {
      if (error.message?.startsWith('Unknown persona')) {
        return res.status(400).json({ error: error.message })
      }

      next(error)
    }
  })

  app.get('/api/youtube/latest', async (req, res, next) => {
    try {
      const videos = await activeYouTubeService.fetchLatestPersonaVideos()

      res.json({ videos })
    } catch (error) {
      next(error)
    }
  })

  app.post('/api/youtube/recommendations', async (req, res, next) => {
    try {
      const { personaId, messages } = req.body || {}
      getPersona(personaId)

      const sanitizedMessages = cleanMessages(messages)
      if (sanitizedMessages.length === 0) {
        return res.status(400).json({ error: 'Please send at least one message.' })
      }

      const result = await activeYouTubeService.fetchRecommendedVideos({
        personaId,
        messages: sanitizedMessages
      })

      res.json(result)
    } catch (error) {
      if (error.message?.startsWith('Unknown persona')) {
        return res.status(400).json({ error: error.message })
      }

      next(error)
    }
  })

  app.post('/api/youtube/video-details', async (req, res, next) => {
    try {
      const { personaId, videoId, videoUrl } = req.body || {}
      getPersona(personaId)

      const video = await activeYouTubeService.fetchCreatorVideoDetails({
        personaId,
        videoId,
        videoUrl
      })

      res.json({ video })
    } catch (error) {
      if (error.message?.startsWith('Unknown persona')) {
        return res.status(400).json({ error: error.message })
      }

      if (
        error.message?.startsWith('Please provide') ||
        error.message?.startsWith('Could not find') ||
        error.message?.startsWith('That video is not')
      ) {
        return res.status(400).json({ error: error.message })
      }

      next(error)
    }
  })

  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath))
    app.get(/^(?!\/api).*/, (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'))
    })
  }

  app.use((err, req, res, next) => {
    if (err.message?.startsWith('OPENAI_API_KEY is missing')) {
      return res.status(500).json({
        error: err.message
      })
    }

    if (err.message?.startsWith('YT_API_KEY is missing')) {
      return res.status(500).json({
        error: err.message
      })
    }

    console.error(err)
    res.status(500).json({
      error: 'Something went wrong while generating the response.'
    })
  })

  return app
}
