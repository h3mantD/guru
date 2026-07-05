<script setup>
defineProps({
  name: {
    type: String,
    required: true
  }
})
</script>

<template>
  <svg
    class="guru-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.9"
    stroke-linecap="round"
    stroke-linejoin="round"
    vector-effect="non-scaling-stroke"
    aria-hidden="true"
    focusable="false"
  >
    <g v-if="name === 'brand'">
      <path d="M6 5.5h12a2.5 2.5 0 0 1 2.5 2.5v8a2.5 2.5 0 0 1-2.5 2.5h-5l-4.5 3v-3H6A2.5 2.5 0 0 1 3.5 16V8A2.5 2.5 0 0 1 6 5.5Z" />
      <path d="m9.5 10-2 2 2 2" />
      <path d="m14.5 10 2 2-2 2" />
      <path d="M12.75 9.25 11.25 14.75" />
    </g>

    <g v-else-if="name === 'simpler'">
      <path d="M6 6h12" />
      <path d="M8 12h8" />
      <path d="M10 18h4" />
      <path d="M4.5 6.5 3 8 1.5 6.5" />
      <path d="M20 16l1.5 1.5L20 19" />
    </g>

    <g v-else-if="name === 'example'">
      <path d="M5 5.5h14v13H5z" />
      <path d="M8 9h5.5" />
      <path d="M8 12h8" />
      <path d="M8 15h4" />
      <path d="M15.25 14.75 17 16.5l3-3.5" />
    </g>

    <g v-else-if="name === 'code'">
      <path d="m8.5 8-4 4 4 4" />
      <path d="m15.5 8 4 4-4 4" />
      <path d="M13 6.75 11 17.25" />
      <path d="M5.5 20h13" />
    </g>

    <g v-else-if="name === 'quiz'">
      <path d="M12 19.5a7.5 7.5 0 1 0-7.5-7.5" />
      <path d="M9.25 9.25A3 3 0 0 1 12 7.5c1.65 0 3 1.05 3 2.5 0 1.2-.8 1.95-2.05 2.55-.75.35-.95.75-.95 1.45" />
      <path d="M12 17h.01" />
      <path d="m3.5 15 2 2 3.5-4" />
    </g>

    <g v-else>
      <path d="M6 12h12" />
      <path d="M12 6v12" />
    </g>
  </svg>
</template>
