import type {
  ServerSentEvent,
  WebSocketConnectionState,
} from '../types/websocket';

const WS_RECONNECT_DELAY_MS = 1000;

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let isConnecting = false;
let currentState: WebSocketConnectionState = 'closed';

const messageListeners = new Set<(event: ServerSentEvent) => void>();
const stateListeners = new Set<(
  state: { state: WebSocketConnectionState; error?: string }
) => void>();

const notifyState = (state: WebSocketConnectionState, error?: string) => {
  currentState = state;
  for (const listener of stateListeners) {
    listener({ state, error });
  }
};

const notifyMessage = (event: ServerSentEvent) => {
  for (const listener of messageListeners) {
    listener(event);
  }
};

const resolveWebSocketUrl = () => {
  const configuredUrl = import.meta.env.VITE_WS_BASE_URL;
  if (configuredUrl) {
    return configuredUrl;
  }

  const apiBase = import.meta.env.VITE_API_BASE_URL;
  if (apiBase && /^https?:/i.test(apiBase)) {
    const url = new URL(apiBase);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.pathname = '/ws';
    url.search = '';
    url.hash = '';
    return url.toString();
  }

  if (typeof window !== 'undefined') {
    const { protocol, host } = window.location;
    const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${host}/ws`;
  }

  throw new Error('Unable to resolve WebSocket URL');
};

const scheduleReconnect = () => {
  if (reconnectTimer || isConnecting) {
    return;
  }

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    ensureWebSocket();
  }, WS_RECONNECT_DELAY_MS);
};

const handleMessage = (message: MessageEvent) => {
  try {
    const data = JSON.parse(message.data) as ServerSentEvent;
    if (!data || typeof data !== 'object' || typeof data.type !== 'string') {
      return;
    }
    notifyMessage(data);
  } catch (error) {
    console.error('Failed to parse WebSocket message', error);
  }
};

const ensureWebSocket = () => {
  if (socket || isConnecting) {
    return socket;
  }

  isConnecting = true;
  notifyState('connecting');

  const url = resolveWebSocketUrl();
  const ws = new WebSocket(url);
  socket = ws;

  ws.addEventListener('open', () => {
    isConnecting = false;
    notifyState('open');
  });

  ws.addEventListener('message', handleMessage);

  ws.addEventListener('error', (event) => {
    console.error('WebSocket error encountered', event);
    notifyState('error', 'Unable to maintain WebSocket connection');
  });

  ws.addEventListener('close', () => {
    socket = null;
    isConnecting = false;
    notifyState('closed');
    scheduleReconnect();
  });

  return ws;
};

export const subscribeToServerEvents = (listener: (event: ServerSentEvent) => void) => {
  messageListeners.add(listener);
  ensureWebSocket();

  return () => {
    messageListeners.delete(listener);
  };
};

export const subscribeToConnectionState = (
  listener: (state: { state: WebSocketConnectionState; error?: string }) => void,
) => {
  stateListeners.add(listener);
  listener({ state: currentState });
  ensureWebSocket();

  return () => {
    stateListeners.delete(listener);
  };
};

export const getCurrentConnectionState = () => currentState;
