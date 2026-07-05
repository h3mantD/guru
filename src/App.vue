<script setup>
import { computed, onMounted, ref } from 'vue'
import { BookOpenCheck, CircleQuestionMark, Code2, ListMinus } from '@lucide/vue'
import ChatInput from './components/ChatInput.vue'
import ChatWindow from './components/ChatWindow.vue'
import GuruIcon from './components/GuruIcon.vue'
import PersonaSelector from './components/PersonaSelector.vue'
import {
  fetchCreatorVideoDetails,
  fetchPersonas,
  fetchVideoRecommendations,
  sendChatMessage
} from './api/chatApi'
import {
  buildQuickActionMessage,
  extractYouTubeUrl,
  formatVideoDetailsReply,
  getDepthLabel,
  getWelcomeMessage,
  wantsCreatorVideoDetails
} from './chatActions'
import { APP_NAME, getPersonaDisplay } from './branding'
import hiteshAvatar from './assets/hitesh.jpg'
import piyushAvatar from './assets/piyush.jpg'

const personaAvatarUrls = {
  hitesh: hiteshAvatar,
  piyush: piyushAvatar
}

function withAvatarUrl(persona) {
  const display = getPersonaDisplay(persona.id)

  return {
    ...persona,
    name: display.mode,
    title: display.subtitle,
    avatarUrl: personaAvatarUrls[persona.id] || ''
  }
}

const fallbackPersonas = [
  {
    id: 'hitesh',
    name: getPersonaDisplay('hitesh').mode,
    title: getPersonaDisplay('hitesh').subtitle,
    avatar: 'HC',
    avatarUrl: hiteshAvatar,
    toneTags: ['Hinglish', 'practical', 'backend', 'interviews']
  },
  {
    id: 'piyush',
    name: getPersonaDisplay('piyush').mode,
    title: getPersonaDisplay('piyush').subtitle,
    avatar: 'PG',
    avatarUrl: piyushAvatar,
    toneTags: ['structured', 'full-stack', 'system design', 'builder']
  }
]

const personas = ref(fallbackPersonas)
const selectedPersonaId = ref('hitesh')
const answerDepth = ref('normal')
const messages = ref([])
const isLoading = ref(false)
const error = ref('')
const mobileResourcesExpanded = ref(false)
const mobileResourcesDismissed = ref(false)
const videoState = ref({
  loading: false,
  error: '',
  intent: null,
  checked: false,
  tool: '',
  details: null,
  videos: []
})

const selectedPersona = computed(() =>
  personas.value.find((persona) => persona.id === selectedPersonaId.value)
)

const selectedPersonaMode = computed(() =>
  getPersonaDisplay(selectedPersonaId.value).mode
)

const selectedPersonaSubtitle = computed(() =>
  getPersonaDisplay(selectedPersonaId.value).subtitle
)

const hasUserMessages = computed(() => messages.value.some((message) => message.role === 'user'))

const hasVideoResourceContent = computed(
  () =>
    videoState.value.loading ||
    videoState.value.error ||
    videoState.value.checked ||
    videoState.value.details ||
    videoState.value.videos.length
)

const showMobileVideoResources = computed(
  () => hasVideoResourceContent.value && !mobileResourcesDismissed.value
)

const latestUserTopic = computed(() => {
  const latestUserMessage = [...messages.value].reverse().find((message) => message.role === 'user')
  return latestUserMessage?.content || 'the current topic'
})

const suggestedPrompts = computed(() => {
  if (selectedPersonaId.value === 'hitesh') {
    return [
      'Background queue kya hota hai?',
      'Explain JWT vs session simply',
      'How should I start JavaScript?'
    ]
  }

  return [
    'WebSocket kab use karte hai?',
    'Design a URL shortener',
    'Explain Redis caching with example'
  ]
})

const quickActions = [
  { id: 'simpler', icon: ListMinus, label: 'Simpler' },
  { id: 'example', icon: BookOpenCheck, label: 'Example' },
  { id: 'code', icon: Code2, label: 'Code' },
  { id: 'quiz', icon: CircleQuestionMark, label: 'Quiz' }
]

onMounted(async () => {
  resetConversation()

  try {
    personas.value = (await fetchPersonas()).map(withAvatarUrl)
  } catch (loadError) {
    error.value = 'Using local persona list because the API is not reachable yet.'
  }
})

function resetVideoState() {
  mobileResourcesExpanded.value = false
  mobileResourcesDismissed.value = false
  videoState.value = {
    loading: false,
    error: '',
    intent: null,
    checked: false,
    tool: '',
    details: null,
    videos: []
  }
}

function resetConversation() {
  error.value = ''
  resetVideoState()
  messages.value = [
    {
      role: 'assistant',
      content: getWelcomeMessage({
        personaId: selectedPersonaId.value,
        depth: answerDepth.value
      })
    }
  ]
}

function switchPersona(personaId) {
  selectedPersonaId.value = personaId
  resetConversation()
}

async function sendContent(content) {
  const cleanContent = content.trim()
  if (!cleanContent || isLoading.value) {
    return
  }

  const nextMessages = [
    ...messages.value,
    {
      role: 'user',
      content: cleanContent
    }
  ]

  messages.value = nextMessages
  isLoading.value = true
  error.value = ''

  try {
    if (wantsCreatorVideoDetails(cleanContent)) {
      videoState.value = {
        loading: true,
        error: '',
        intent: null,
        checked: false,
        tool: 'details',
        details: null,
        videos: []
      }
      mobileResourcesExpanded.value = true
      mobileResourcesDismissed.value = false

      const video = await fetchCreatorVideoDetails({
        personaId: selectedPersonaId.value,
        videoUrl: extractYouTubeUrl(cleanContent)
      })

      videoState.value = {
        loading: false,
        error: '',
        intent: null,
        checked: false,
        tool: 'details',
        details: video,
        videos: []
      }

      messages.value = [
        ...nextMessages,
        {
          role: 'assistant',
          content: formatVideoDetailsReply(video)
        }
      ]
      return
    }

    const reply = await sendChatMessage({
      personaId: selectedPersonaId.value,
      answerDepth: answerDepth.value,
      messages: nextMessages
    })

    messages.value = [
      ...nextMessages,
      {
        role: 'assistant',
        content: reply
      }
    ]
  } catch (sendError) {
    if (videoState.value.loading) {
      videoState.value = {
        loading: false,
        error: sendError.message,
        intent: null,
        checked: false,
        tool: videoState.value.tool,
        details: null,
        videos: []
      }
    }

    error.value = sendError.message
  } finally {
    isLoading.value = false
  }
}

function handleQuickAction(actionId) {
  sendContent(buildQuickActionMessage(actionId, latestUserTopic.value))
}

async function suggestVideos() {
  if (!hasUserMessages.value || videoState.value.loading) {
    return
  }

  videoState.value = {
    loading: true,
    error: '',
    intent: null,
    checked: false,
    tool: 'recommendations',
    details: null,
    videos: []
  }
  mobileResourcesExpanded.value = true
  mobileResourcesDismissed.value = false

  try {
    const result = await fetchVideoRecommendations({
      personaId: selectedPersonaId.value,
      messages: messages.value
    })

    videoState.value = {
      loading: false,
      error: '',
      intent: result.intent,
      checked: true,
      tool: 'recommendations',
      details: null,
      videos: result.videos || []
    }
  } catch (videoError) {
    videoState.value = {
      loading: false,
      error: videoError.message,
      intent: null,
      checked: false,
      tool: 'recommendations',
      details: null,
      videos: []
    }
  }
}
</script>

<template>
  <main class="app-shell">
    <aside class="sidebar" :aria-label="`${APP_NAME} controls`">
      <button class="brand" type="button" @click="resetConversation" :aria-label="`Start a new ${APP_NAME} chat`">
        <span class="brand-mark" aria-hidden="true">
          <GuruIcon name="brand" />
        </span>
        <span>{{ APP_NAME }}</span>
      </button>

      <button class="btn btn-primary new-chat" type="button" @click="resetConversation">
        + New chat
      </button>

      <section class="side-section">
        <h2>Choose persona</h2>
        <PersonaSelector
          :personas="personas"
          :selected-persona-id="selectedPersonaId"
          @select="switchPersona"
        />
      </section>

      <section class="side-section">
        <h2>Suggested starts</h2>
        <div class="prompt-list">
          <button
            v-for="prompt in suggestedPrompts"
            :key="prompt"
            type="button"
            :disabled="isLoading"
            @click="sendContent(prompt)"
          >
            {{ prompt }}
          </button>
        </div>
      </section>
    </aside>

    <section class="app-main" aria-label="Chat">
      <header class="chat-header" v-if="selectedPersona">
        <div class="current-persona">
          <span class="avatar">
            <img v-if="selectedPersona.avatarUrl" :src="selectedPersona.avatarUrl" :alt="selectedPersonaMode" />
            <span v-else>{{ selectedPersona.avatar }}</span>
          </span>
          <span>
            <h1>{{ selectedPersonaMode }}</h1>
            <p>{{ selectedPersonaSubtitle }} · {{ getDepthLabel(answerDepth) }} replies</p>
          </span>
        </div>
        <div class="header-actions">
          <button class="btn btn-ghost" type="button" @click="resetConversation">
            Clear chat
          </button>
          <button
            v-if="hasUserMessages"
            class="btn btn-ghost"
            type="button"
            :disabled="videoState.loading || isLoading"
            @click="suggestVideos"
          >
            {{ videoState.loading ? 'Finding videos...' : 'Suggest videos' }}
          </button>
        </div>
        <label class="mobile-persona-select">
          <span>Persona</span>
          <select :value="selectedPersonaId" @change="switchPersona($event.target.value)">
            <option v-for="persona in personas" :key="persona.id" :value="persona.id">
              {{ getPersonaDisplay(persona.id).mode }}
            </option>
          </select>
        </label>
      </header>

      <ChatWindow
        :messages="messages"
        :persona="selectedPersona"
        :is-loading="isLoading"
      />

      <div v-if="!hasUserMessages" class="mobile-starter-prompts" aria-label="Suggested starts">
        <button
          v-for="prompt in suggestedPrompts"
          :key="prompt"
          type="button"
          :disabled="isLoading"
          @click="sendContent(prompt)"
        >
          {{ prompt }}
        </button>
      </div>

      <div v-if="hasUserMessages" class="quick-actions" aria-label="Follow-up actions">
        <button
          v-for="action in quickActions"
          :key="action.id"
          type="button"
          :disabled="isLoading"
          @click="handleQuickAction(action.id)"
        >
          <span class="action-icon" aria-hidden="true">
            <component :is="action.icon" :size="18" :stroke-width="2.15" />
          </span>
          <span>{{ action.label }}</span>
        </button>
      </div>

      <section
        v-if="showMobileVideoResources"
        class="mobile-resource-tray"
        :class="{ collapsed: !mobileResourcesExpanded }"
        aria-label="Video resources"
      >
        <div class="resource-tray-header">
          <h2>{{ videoState.details ? 'Video details' : 'Suggested resources' }}</h2>
          <button
            class="resource-toggle"
            type="button"
            :aria-expanded="mobileResourcesExpanded"
            @click="mobileResourcesExpanded = !mobileResourcesExpanded"
          >
            {{ mobileResourcesExpanded ? 'Hide' : 'Show' }}
          </button>
          <button
            class="resource-close"
            type="button"
            aria-label="Close video resources"
            @click="mobileResourcesDismissed = true"
          >
            ×
          </button>
        </div>
        <div class="resource-tray-body">
          <p v-if="videoState.intent" class="resource-intent">
            Based on: {{ videoState.intent.keywords.join(', ') }}
          </p>
          <p v-if="videoState.loading" class="muted">
            {{
              videoState.tool === 'details'
                ? 'Checking this video against the selected creator channel...'
                : 'Finding relevant videos from the selected creator channel...'
            }}
          </p>
          <p v-else-if="videoState.error" class="error-message inline">{{ videoState.error }}</p>
          <a
            v-else-if="videoState.details"
            class="resource-card detail-card"
            :href="videoState.details.url"
            target="_blank"
            rel="noreferrer"
          >
            <img
              v-if="videoState.details.thumbnailUrl"
              :src="videoState.details.thumbnailUrl"
              :alt="videoState.details.title"
            />
            <span v-else class="resource-fallback" aria-hidden="true">▶</span>
            <span>
              <strong>{{ videoState.details.title }}</strong>
              <small>{{ videoState.details.channelTitle }}</small>
            </span>
          </a>
          <p v-else-if="videoState.checked && !videoState.videos.length" class="empty-note">
            No suitable creator video matched this chat closely enough.
          </p>
          <div v-else class="resource-list">
            <a
              v-for="video in videoState.videos"
              :key="video.videoId"
              class="resource-card"
              :href="video.url"
              target="_blank"
              rel="noreferrer"
            >
              <img v-if="video.thumbnailUrl" :src="video.thumbnailUrl" :alt="video.title" />
              <span v-else class="resource-fallback" aria-hidden="true">▶</span>
              <span>
                <strong>{{ video.title }}</strong>
                <small>{{ video.channelTitle }}</small>
                <small v-if="video.matchedKeywords?.length">
                  Matched: {{ video.matchedKeywords.join(', ') }}
                </small>
              </span>
            </a>
          </div>
        </div>
      </section>

      <p v-if="error" class="error-message">{{ error }}</p>

      <ChatInput
        :disabled="isLoading"
        :answer-depth="answerDepth"
        @update:answer-depth="answerDepth = $event"
        @send="sendContent"
      />
    </section>

    <aside class="resource-panel" aria-label="Resources and session details">
      <section class="resource-section">
        <h2>Current mode</h2>
        <div class="mode-card">
          <span class="avatar">
            <img
              v-if="selectedPersona?.avatarUrl"
              :src="selectedPersona.avatarUrl"
              :alt="selectedPersonaMode"
            />
            <span v-else>{{ selectedPersona?.avatar || 'CP' }}</span>
          </span>
          <div>
            <h3>{{ selectedPersonaMode }}</h3>
            <p>{{ selectedPersonaSubtitle }}</p>
            <div class="tags">
              <span v-for="tag in selectedPersona?.toneTags || []" :key="tag">{{ tag }}</span>
            </div>
          </div>
        </div>
      </section>

      <section v-if="hasVideoResourceContent" class="resource-section">
        <h2>{{ videoState.details ? 'Video details' : 'Suggested resources' }}</h2>
        <p v-if="videoState.intent" class="resource-intent">
          Based on: {{ videoState.intent.keywords.join(', ') }}
        </p>
        <p v-if="videoState.loading" class="muted">
          {{
            videoState.tool === 'details'
              ? 'Checking this video against the selected creator channel...'
              : 'Finding relevant videos from the selected creator channel...'
          }}
        </p>
        <p v-else-if="videoState.error" class="error-message inline">{{ videoState.error }}</p>
        <a
          v-else-if="videoState.details"
          class="resource-card detail-card"
          :href="videoState.details.url"
          target="_blank"
          rel="noreferrer"
        >
          <img
            v-if="videoState.details.thumbnailUrl"
            :src="videoState.details.thumbnailUrl"
            :alt="videoState.details.title"
          />
          <span v-else class="resource-fallback" aria-hidden="true">▶</span>
          <span>
            <strong>{{ videoState.details.title }}</strong>
            <small>{{ videoState.details.channelTitle }}</small>
          </span>
        </a>
        <p v-else-if="videoState.checked && !videoState.videos.length" class="empty-note">
          No suitable creator video matched this chat closely enough.
        </p>
        <div v-else class="resource-list">
          <a
            v-for="video in videoState.videos"
            :key="video.videoId"
            class="resource-card"
            :href="video.url"
            target="_blank"
            rel="noreferrer"
          >
            <img v-if="video.thumbnailUrl" :src="video.thumbnailUrl" :alt="video.title" />
            <span v-else class="resource-fallback" aria-hidden="true">▶</span>
            <span>
              <strong>{{ video.title }}</strong>
              <small>{{ video.channelTitle }}</small>
              <small v-if="video.matchedKeywords?.length">
                Matched: {{ video.matchedKeywords.join(', ') }}
              </small>
            </span>
          </a>
        </div>
      </section>

      <p class="disclaimer">
        {{ APP_NAME }} is an AI assistant inspired by public teaching styles. Not affiliated with the creators.
      </p>
    </aside>
  </main>
</template>
