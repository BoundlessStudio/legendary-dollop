import type { Webhooks } from 'openai/resources/webhooks.js';

export type ResponseWebhookEvent =
  | Webhooks.ResponseCompletedWebhookEvent
  | Webhooks.ResponseFailedWebhookEvent
  | Webhooks.ResponseCancelledWebhookEvent
  | Webhooks.ResponseIncompleteWebhookEvent;

const RESPONSE_EVENT_TYPES = new Set<ResponseWebhookEvent['type']>([
  'response.completed',
  'response.failed',
  'response.cancelled',
  'response.incomplete',
]);

export const isResponseWebhookEvent = (
  event: Webhooks.UnwrapWebhookEvent,
): event is ResponseWebhookEvent => RESPONSE_EVENT_TYPES.has(event.type as ResponseWebhookEvent['type']);

export const getResponseStatusFromEvent = (event: ResponseWebhookEvent) =>
  event.type.replace('response.', '');
