import { defineStore } from 'pinia';
import { ref } from 'vue';

import {
  getCurrentConnectionState,
  subscribeToConnectionState,
  subscribeToServerEvents,
} from '../services/websocketClient';
import type { ResponseStatusEvent, WebSocketConnectionState } from '../types/websocket';

const MAX_EVENTS = 20;

export const useResponseEventsStore = defineStore('responseEvents', () => {
  const events = ref<ResponseStatusEvent['data'][]>([]);
  const connectionState = ref<WebSocketConnectionState>(getCurrentConnectionState());
  const lastError = ref<string | null>(null);
  let initialized = false;
  let unsubscribeFromEvents: (() => void) | null = null;
  let unsubscribeFromState: (() => void) | null = null;

  const init = () => {
    if (initialized) {
      return;
    }
    initialized = true;

    unsubscribeFromEvents = subscribeToServerEvents((event) => {
      if (event.type !== 'response.status') {
        return;
      }

      events.value.unshift(event.data);
      if (events.value.length > MAX_EVENTS) {
        events.value.splice(MAX_EVENTS);
      }
    });

    unsubscribeFromState = subscribeToConnectionState(({ state, error }) => {
      connectionState.value = state;

      if (error) {
        lastError.value = error;
      } else if (state === 'open') {
        lastError.value = null;
      }
    });
  };

  const clear = () => {
    events.value = [];
  };

  const dispose = () => {
    unsubscribeFromEvents?.();
    unsubscribeFromEvents = null;

    unsubscribeFromState?.();
    unsubscribeFromState = null;

    initialized = false;
  };

  return {
    events,
    connectionState,
    lastError,
    init,
    clear,
    dispose,
  };
});
