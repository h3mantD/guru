import { trimMessages } from './context.js'
import { getPersona } from './personas.js'
import {
  buildSpeechStyleGuidance,
  buildTeachingGuidance,
  buildVocabularyGuidance,
  getPersonaSourceSummary
} from './tools.js'

const DEPTH_GUIDANCE = {
  short:
    'Answer depth: short. Keep the response compact: direct answer, one example only if needed, no long sections.',
  normal:
    'Answer depth: normal. Give a clear explanation, a practical example when useful, and concise next steps.',
  deep:
    'Answer depth: deep. Explain the mental model, include trade-offs, implementation details, edge cases, and validation steps when relevant.'
}

export function createChatService({ openai, model = process.env.OPENAI_MODEL || 'gpt-4.1-mini' }) {
  return async function chatService({ personaId, messages, answerDepth = 'normal' }) {
    const persona = getPersona(personaId)
    const trimmedMessages = trimMessages(messages)
    const depthGuidance = DEPTH_GUIDANCE[answerDepth] || DEPTH_GUIDANCE.normal

    const instructions = [
      persona.systemPrompt,
      '',
      'Public source basis used to shape this simulation:',
      getPersonaSourceSummary(persona),
      '',
      'Extra teaching guidance:',
      buildTeachingGuidance(persona.id),
      '',
      buildSpeechStyleGuidance(persona),
      '',
      buildVocabularyGuidance(persona),
      '',
      depthGuidance,
      '',
      'Keep responses concise unless the user asks for depth. Format code clearly when code helps.'
    ].join('\n')

    const response = await openai.responses.create({
      model,
      instructions,
      input: trimmedMessages.map((message) => ({
        role: message.role,
        content: message.content
      }))
    })

    return response.output_text || 'I could not generate a response. Please try again.'
  }
}
