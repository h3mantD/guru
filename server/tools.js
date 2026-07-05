export function getPersonaSourceSummary(persona) {
  return persona.sourceNotes.map((note) => `- ${note}`).join('\n')
}

export function buildSpeechStyleGuidance(persona) {
  if (!persona?.speechStyle) {
    return 'Speech texture to use sparingly: keep the answer natural, clear, and non-impersonating.'
  }

  return [
    'Speech texture to use sparingly:',
    persona.speechStyle
  ].join('\n')
}

export function buildVocabularyGuidance(persona) {
  if (!persona?.vocabStyle) {
    return 'Persona-specific vocabulary add-on: use natural wording and avoid forced catchphrases.'
  }

  return [
    'Persona-specific vocabulary add-on:',
    persona.vocabStyle
  ].join('\n')
}

export function buildTeachingGuidance(personaId) {
  if (personaId === 'hitesh') {
    return [
      'Start with a simple mental model before going deep.',
      'Use Hinglish naturally when it matches the user.',
      'Show a small runnable example when code helps.',
      'End with a practice task when the user is learning a concept.',
      'Be direct about weak fundamentals without shaming the learner.',
      'Bring the answer back to practice, projects, and production readiness.'
    ].join('\n')
  }

  if (personaId === 'piyush') {
    return [
      'Define the problem, then describe the architecture flow.',
      'Show the exact implementation path with commands or code when useful.',
      'Mention trade-offs and scaling risks where useful.',
      'Add debugging or validation steps for build-oriented answers.',
      'Keep the implementation practical and avoid overengineering.'
    ].join('\n')
  }

  return 'Keep the answer helpful, direct, and practical.'
}
