import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import type {
  ResponseCreateParamsNonStreaming,
  ResponseRetrieveParamsNonStreaming,
} from 'openai/resources/responses/responses';
import type { InputItemListParams } from 'openai/resources/responses/input-items';

import { getOpenAIClient } from '../lib/openaiClient.js';
import { extractBoolean, extractNumber, extractString, extractStringArray } from './utils.js';

const toResponseRetrieveParams = (query: Request['query']): ResponseRetrieveParamsNonStreaming => {
  const params: ResponseRetrieveParamsNonStreaming = { stream: false };

  const include = extractStringArray(query.include);
  if (include) {
    params.include = include as ResponseRetrieveParamsNonStreaming['include'];
  }

  const includeObfuscation = extractBoolean(query.include_obfuscation);
  if (typeof includeObfuscation === 'boolean') {
    params.include_obfuscation = includeObfuscation;
  }

  const startingAfter = extractNumber(query.starting_after);
  if (typeof startingAfter === 'number' && startingAfter >= 0) {
    params.starting_after = startingAfter;
  }

  return params;
};

const toInputItemListParams = (query: Request['query']): InputItemListParams => {
  const params: InputItemListParams = {};

  const include = extractStringArray(query.include);
  if (include) {
    params.include = include as InputItemListParams['include'];
  }

  const order = extractString(query.order);
  if (order === 'asc' || order === 'desc') {
    params.order = order;
  }

  const after = extractString(query.after);
  if (after) {
    params.after = after;
  }

  const limit = extractNumber(query.limit);
  if (typeof limit === 'number' && limit > 0) {
    params.limit = limit;
  }

  return params;
};

export const responsesRouter = Router();
const responseInputItemsRouter = Router({ mergeParams: true });

responsesRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Request body must be a JSON object.' });
    }

    const rawBody = req.body as Record<string, unknown>;
    const streamFlag = extractBoolean(rawBody.stream);
    if (streamFlag === true) {
      return res.status(400).json({ error: 'Streaming responses are not supported by this endpoint.' });
    }

    const { stream: _ignored, ...rest } = rawBody;
    const createParams: ResponseCreateParamsNonStreaming = {
      ...(rest as ResponseCreateParamsNonStreaming),
      stream: false,
    };

    const client = getOpenAIClient();
    const response = await client.responses.create(createParams);

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

responsesRouter.get('/:responseId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stream = extractBoolean(req.query.stream);
    if (stream === true) {
      return res.status(400).json({ error: 'Streaming responses are not supported by this endpoint.' });
    }

    const params = toResponseRetrieveParams(req.query);

    const client = getOpenAIClient();
    const response = await client.responses.retrieve(req.params.responseId, params);

    res.json(response);
  } catch (error) {
    next(error);
  }
});

responsesRouter.delete('/:responseId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = getOpenAIClient();
    await client.responses.delete(req.params.responseId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

responsesRouter.post('/:responseId/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = getOpenAIClient();
    const response = await client.responses.cancel(req.params.responseId);

    res.json(response);
  } catch (error) {
    next(error);
  }
});

responsesRouter.use('/:responseId/input-items', responseInputItemsRouter);

responseInputItemsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = toInputItemListParams(req.query);

    const client = getOpenAIClient();
    const items = await client.responses.inputItems.list(
      req.params.responseId,
      Object.keys(params).length > 0 ? params : undefined,
    );

    res.json(items);
  } catch (error) {
    next(error);
  }
});
