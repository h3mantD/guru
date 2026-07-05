export const APP_NAME = 'Guru'

const PERSONA_DISPLAY = {
  hitesh: {
    mode: 'Practical Guru',
    subtitle: 'Inspired by Hitesh'
  },
  piyush: {
    mode: 'Builder Guru',
    subtitle: 'Inspired by Piyush Garg'
  }
}

export function getPersonaDisplay(personaId) {
  return PERSONA_DISPLAY[personaId] || PERSONA_DISPLAY.hitesh
}
