import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import OpenAI from 'openai';
import type { FileCreateParams, FileListParams, FilePurpose } from 'openai/resources/files';

import { getOpenAIClient } from '../lib/openaiClient.js';
import { extractNumber, extractString } from './utils.js';

const VALID_PURPOSES: FilePurpose[] = ['assistants', 'batch', 'fine-tune', 'vision', 'user_data', 'evals'];

const toFileListParams = (query: Request['query']): Partial<FileListParams> => {
  const params: Partial<FileListParams> = {};

  const order = extractString(query.order);
  if (order === 'asc' || order === 'desc') {
    params.order = order;
  }

  const purpose = extractString(query.purpose);
  if (purpose) {
    params.purpose = purpose;
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

export const filesRouter = Router();

filesRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = getOpenAIClient();
    const params = toFileListParams(req.query);
    const response = await client.files.list(Object.keys(params).length ? params : undefined);

    res.json(response);
  } catch (error) {
    next(error);
  }
});

filesRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = getOpenAIClient();
    const { filename, purpose, content, mimeType, expiresAfter } = req.body as Record<string, unknown>;

    if (typeof filename !== 'string' || filename.trim().length === 0) {
      return res.status(400).json({ error: 'filename is required' });
    }

    if (typeof purpose !== 'string' || purpose.trim().length === 0) {
      return res.status(400).json({ error: 'purpose is required' });
    }

    const normalizedPurpose = purpose.trim() as FilePurpose;
    if (!VALID_PURPOSES.includes(normalizedPurpose)) {
      return res.status(400).json({ error: `purpose must be one of: ${VALID_PURPOSES.join(', ')}` });
    }

    if (typeof content !== 'string' || content.length === 0) {
      return res.status(400).json({ error: 'content (base64 encoded string) is required' });
    }

    const buffer = Buffer.from(content, 'base64');
    const upload = await OpenAI.toFile(
      buffer,
      filename,
      typeof mimeType === 'string' && mimeType.length > 0 ? { type: mimeType } : undefined,
    );

    let expiresAfterParam: FileCreateParams['expires_after'];
    if (expiresAfter && typeof expiresAfter === 'object') {
      const { anchor, seconds } = expiresAfter as { anchor?: unknown; seconds?: unknown };
      if (anchor === 'created_at' && typeof seconds === 'number') {
        expiresAfterParam = { anchor, seconds };
      }
    }

    const created = await client.files.create({
      file: upload,
      purpose: normalizedPurpose,
      ...(expiresAfterParam ? { expires_after: expiresAfterParam } : {}),
    });

    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

filesRouter.get('/:fileId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = getOpenAIClient();
    const file = await client.files.retrieve(req.params.fileId);
    res.json(file);
  } catch (error) {
    next(error);
  }
});

filesRouter.get('/:fileId/content', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = getOpenAIClient();
    const response = await client.files.content(req.params.fileId);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.json({
      id: req.params.fileId,
      contentType: response.headers.get('content-type'),
      base64: buffer.toString('base64'),
    });
  } catch (error) {
    next(error);
  }
});

filesRouter.delete('/:fileId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = getOpenAIClient();
    const deleted = await client.files.delete(req.params.fileId);
    res.json(deleted);
  } catch (error) {
    next(error);
  }
});
