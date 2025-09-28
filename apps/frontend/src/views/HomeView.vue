<template>
  <section class="home-view">
    <h2>Dashboard</h2>
    <p class="lead">This dashboard shows the current status of the API server.</p>

    <div class="status-card" v-if="health">
      <h3>API Status: <span :class="['status-pill', health.status]">{{ health.status }}</span></h3>
      <p><strong>Uptime:</strong> {{ uptime }}</p>
      <p><strong>Timestamp:</strong> {{ formatTimestamp(health.timestamp) }}</p>
    </div>

    <p v-else-if="error" class="error">{{ error }}</p>
    <p v-else>Loading health information…</p>

    <div class="status-card">
      <div class="card-header">
        <h3>Response API Updates</h3>
        <span :class="['status-pill', websocketConnectionClass]">{{ websocketConnectionLabel }}</span>
      </div>
      <p class="muted">Live updates pushed from the server via WebSocket.</p>
      <p v-if="websocketError" class="error">{{ websocketError }}</p>
      <ul v-if="responseEvents.length" class="event-list">
        <li v-for="event in responseEvents" :key="`${event.responseId}-${event.receivedAt}`">
          <span class="event-response-id">{{ event.responseId }}</span>
          <span class="event-status">{{ formatEventStatus(event.status) }}</span>
          <time class="event-timestamp">{{ formatTimestamp(event.receivedAt) }}</time>
        </li>
      </ul>
      <p v-else class="muted">No response events received yet.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';

import { fetchHealth, type ApiHealthResponse } from '../services/apiClient';
import { useResponseEventsStore } from '../stores/useResponseEventsStore';

const health = ref<ApiHealthResponse | null>(null);
const error = ref<string | null>(null);

const responseEventsStore = useResponseEventsStore();
responseEventsStore.init();

const { events: responseEvents, connectionState, lastError: websocketError } =
  storeToRefs(responseEventsStore);

const uptime = computed(() => {
  if (!health.value) return '';
  const seconds = Math.floor(health.value.uptimeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
});

const formatTimestamp = (timestamp: string) => new Date(timestamp).toLocaleString();

const websocketConnectionLabel = computed(() => {
  switch (connectionState.value) {
    case 'open':
      return 'connected';
    case 'connecting':
      return 'connecting';
    case 'error':
      return 'error';
    default:
      return 'disconnected';
  }
});

const websocketConnectionClass = computed(() => {
  switch (connectionState.value) {
    case 'open':
      return 'ok';
    case 'connecting':
      return 'pending';
    case 'error':
      return 'error';
    default:
      return 'closed';
  }
});

const formatEventStatus = (status: string) =>
  status
    .split(/[_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

onMounted(async () => {
  try {
    health.value = await fetchHealth();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load API status';
  }
});
</script>

<style scoped>
.home-view {
  max-width: 640px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.lead {
  font-size: 1.05rem;
  color: #4b5563;
}

.status-card {
  background: #fff;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.status-pill {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.85rem;
}

.status-pill.ok {
  background-color: #dcfce7;
  color: #166534;
}

.status-pill.pending {
  background-color: #fef9c3;
  color: #92400e;
}

.status-pill.error,
.status-pill.closed {
  background-color: #fee2e2;
  color: #b91c1c;
}

.muted {
  color: #6b7280;
  font-size: 0.95rem;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.event-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.event-list li {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.6rem 0.8rem;
  background: #f9fafb;
  border-radius: 0.5rem;
}

.event-response-id {
  font-family: 'SFMono-Regular', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-size: 0.85rem;
  color: #1f2937;
  word-break: break-all;
}

.event-status {
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: capitalize;
}

.event-timestamp {
  font-size: 0.8rem;
  color: #6b7280;
}

.error {
  color: #b91c1c;
  font-weight: 600;
}
</style>
