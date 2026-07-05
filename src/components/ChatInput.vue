<script setup>
import { ref } from 'vue'

defineProps({
  disabled: {
    type: Boolean,
    default: false
  },
  answerDepth: {
    type: String,
    default: 'normal'
  }
})

const emit = defineEmits(['send', 'update:answerDepth'])
const draft = ref('')

function submitMessage() {
  const content = draft.value.trim()
  if (!content) {
    return
  }

  emit('send', content)
  draft.value = ''
}
</script>

<template>
  <form class="composer" @submit.prevent="submitMessage">
    <textarea
      v-model="draft"
      :disabled="disabled"
      rows="2"
      placeholder="Ask your doubt in Hinglish..."
      @keydown.enter.exact.prevent="submitMessage"
    />
    <div class="composer-bottom">
      <div class="segmented" aria-label="Answer depth">
        <button
          v-for="depth in ['short', 'normal', 'deep']"
          :key="depth"
          type="button"
          :class="{ active: answerDepth === depth }"
          :disabled="disabled"
          @click="emit('update:answerDepth', depth)"
        >
          {{ depth[0].toUpperCase() + depth.slice(1) }}
        </button>
      </div>
      <button class="send-btn" type="submit" :disabled="disabled || !draft.trim()" aria-label="Send message">
        ➤
      </button>
    </div>
  </form>
</template>
