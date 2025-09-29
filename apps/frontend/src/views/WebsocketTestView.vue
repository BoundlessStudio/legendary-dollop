<template>
  <section class="websocket-test-view">
    <h2>WebSocket Test Lab</h2>
    <p class="lead">
      Use this page to trigger dummy server events and verify the real-time updates flowing through
      the WebSocket connection.
    </p>

    <div class="card">
      <div class="card-header">
        <h3>Connection status</h3>
        <span :class="['status-pill', websocketConnectionClass]">{{ websocketConnectionLabel }}</span>
      </div>
      <p class="muted">
        When the connection is open, pressing the button below dispatches 10 synthetic
        <code>response.status</code> events from the API.
      </p>
      <p v-if="websocketError" class="error">{{ websocketError }}</p>
      <p v-if="triggerError" class="error">{{ triggerError }}</p>
      <p v-if="triggerMessage" class="success">{{ triggerMessage }}</p>
      <div class="actions">
        <button type="button" @click="triggerEvents" :disabled="isTriggering">
          <span v-if="isTriggering">Dispatching events…</span>
          <span v-else>Send 10 dummy events</span>
        </button>
        <button type="button" class="secondary" @click="clearEvents" :disabled="!responseEvents.length">
          Clear events
        </button>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>Received events</h3>
        <span class="muted">Showing the latest {{ responseEvents.length }} events</span>
      </div>
      <ul v-if="responseEvents.length" class="event-list">
        <li v-for="event in responseEvents" :key="`${event.responseId}-${event.receivedAt}`">
          <span class="event-response-id">{{ event.responseId }}</span>
          <span class="event-status">{{ formatEventStatus(event.status) }}</span>
          <time class="event-timestamp">{{ formatTimestamp(event.receivedAt) }}</time>
        </li>
      </ul>
      <p v-else class="muted">No events received yet. Trigger some above!</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';

import { triggerResponseSimulation } from '../services/apiClient';
import { useResponseEventsStore } from '../stores/useResponseEventsStore';

const responseEventsStore = useResponseEventsStore();
responseEventsStore.init();

const { events: responseEvents, connectionState, lastError: websocketError } =
  storeToRefs(responseEventsStore);

const isTriggering = ref(false);
const triggerError = ref<string | null>(null);
const triggerMessage = ref<string | null>(null);

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

const formatTimestamp = (timestamp: string) => new Date(timestamp).toLocaleString();

const formatEventStatus = (status: string) =>
  status
    .split(/[\s_]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const triggerEvents = async () => {
  if (isTriggering.value) {
    return;
  }

  isTriggering.value = true;
  triggerError.value = null;

  try {
    const message = await triggerResponseSimulation();
    const timestamp = new Date().toLocaleTimeString();
    triggerMessage.value = `${message} (${timestamp})`;
  } catch (error) {
    triggerMessage.value = null;
    triggerError.value =
      error instanceof Error ? error.message : 'Failed to trigger simulated events';
  } finally {
    isTriggering.value = false;
  }
};

const clearEvents = () => {
  responseEventsStore.clear();
};
</script>

<style scoped>
.websocket-test-view {
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.lead {
  font-size: 1.05rem;
  color: #4b5563;
}

.card {
  background: #fff;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
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

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

button {
  border: none;
  border-radius: 0.5rem;
  padding: 0.6rem 1.2rem;
  font-weight: 600;
  cursor: pointer;
  background: linear-gradient(120deg, #42b883, #2f7e5b);
  color: #fff;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
  box-shadow: none;
}

button:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 25px rgba(66, 184, 131, 0.35);
}

button.secondary {
  background: #e5e7eb;
  color: #1f2937;
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

.success {
  color: #047857;
  font-weight: 600;
}
</style>
