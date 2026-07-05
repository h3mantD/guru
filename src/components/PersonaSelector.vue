<script setup>
import { getPersonaDisplay } from '../branding'

defineProps({
  personas: {
    type: Array,
    required: true
  },
  selectedPersonaId: {
    type: String,
    required: true
  }
})

defineEmits(['select'])
</script>

<template>
  <div class="persona-list" aria-label="Choose a persona">
    <button
      v-for="persona in personas"
      :key="persona.id"
      type="button"
      class="persona-card"
      :class="{ active: persona.id === selectedPersonaId }"
      @click="$emit('select', persona.id)"
    >
      <span class="avatar small">
        <img v-if="persona.avatarUrl" :src="persona.avatarUrl" :alt="persona.name" />
        <span v-else>{{ persona.avatar }}</span>
      </span>
      <span>
        <strong>{{ getPersonaDisplay(persona.id).mode }}</strong>
        <small>{{ getPersonaDisplay(persona.id).subtitle }}</small>
      </span>
      <span class="persona-check" aria-hidden="true">{{ persona.id === selectedPersonaId ? '✓' : '' }}</span>
    </button>
  </div>
</template>
