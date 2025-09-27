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
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { fetchHealth, type ApiHealthResponse } from '../services/apiClient';

const health = ref<ApiHealthResponse | null>(null);
const error = ref<string | null>(null);

const uptime = computed(() => {
  if (!health.value) return '';
  const seconds = Math.floor(health.value.uptimeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
});

const formatTimestamp = (timestamp: string) => new Date(timestamp).toLocaleString();

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

.error {
  color: #b91c1c;
  font-weight: 600;
}
</style>
