export type ConnectionEstablishedEvent = {
  type: 'connection.established';
  data: {
    timestamp: string;
  };
};

export type ResponseStatusEvent = {
  type: 'response.status';
  data: {
    responseId: string;
    eventType: string;
    status: string;
    receivedAt: string;
  };
};

export type ServerSentEvent = ConnectionEstablishedEvent | ResponseStatusEvent;

export type WebSocketConnectionState = 'connecting' | 'open' | 'closed' | 'error';
