<script setup>
import { nextTick, ref, watch } from 'vue'
import { getAutoScrollAction, isNearBottom } from '../utils/chatScroll'
import { renderMarkdown } from '../utils/renderMarkdown'

const props = defineProps({
  messages: {
    type: Array,
    required: true
  },
  persona: {
    type: Object,
    default: null
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const scrollArea = ref(null)
const previousScrollState = ref({
  count: props.messages.length,
  isLoading: props.isLoading
})

watch(
  () => [props.messages.length, props.isLoading],
  async () => {
    const area = scrollArea.value
    const wasNearBottom = isNearBottom(area)
    const previous = previousScrollState.value
    const current = {
      count: props.messages.length,
      isLoading: props.isLoading
    }
    const action = getAutoScrollAction({
      wasNearBottom,
      previousCount: previous.count,
      currentCount: current.count,
      newestRole: props.messages.at(-1)?.role,
      currentIsLoading: current.isLoading
    })

    previousScrollState.value = current

    await nextTick()

    if (!area || action === 'none') {
      return
    }

    if (action === 'bottom') {
      area.scrollTop = area.scrollHeight
      return
    }

    if (action === 'assistant-start') {
      const messageRows = area.querySelectorAll('.message-row')
      messageRows[messageRows.length - 1]?.scrollIntoView({ block: 'start' })
    }
  }
)
</script>

<template>
  <div ref="scrollArea" class="chat-window">
    <article
      v-for="(message, index) in messages"
      :key="`${message.role}-${index}`"
      class="message-row"
      :class="message.role"
    >
      <div v-if="message.role !== 'user'" class="avatar small" aria-hidden="true">
        <img v-if="persona?.avatarUrl" :src="persona.avatarUrl" alt="" />
        <span v-else>{{ persona?.avatar || 'CP' }}</span>
      </div>
      <div class="message-bubble">
        <span v-if="message.role === 'user'">{{ message.content }}</span>
        <div v-else class="markdown-body" v-html="renderMarkdown(message.content)"></div>
        <div class="message-time">{{ message.role === 'user' ? 'You' : persona?.avatar || 'AI' }}</div>
      </div>
    </article>

    <article v-if="isLoading" class="message-row assistant">
      <div class="avatar small" aria-hidden="true">
        <img v-if="persona?.avatarUrl" :src="persona.avatarUrl" alt="" />
        <span v-else>{{ persona?.avatar || 'CP' }}</span>
      </div>
      <div class="message-bubble typing">Thinking...</div>
    </article>
  </div>
</template>
