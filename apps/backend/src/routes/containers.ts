import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import OpenAI from 'openai';
import type { ContainerCreateParams, ContainerListParams } from 'openai/resources/containers';
import type { FileListParams as ContainerFileListParams } from 'openai/resources/containers/files/files';

import { getOpenAIClient } from '../lib/openaiClient.js';
import { extractNumber, extractString, extractStringArray } from './utils.js';

const toContainerListParams = (query: Request['query']): Partial<ContainerListParams> => {
  const params: Partial<ContainerListParams> = {};

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

const toContainerFileListParams = (query: Request['query']): Partial<ContainerFileListParams> => {
  const params: Partial<ContainerFileListParams> = {};

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

export const containersRouter = Router();
const containerFilesRouter = Router({ mergeParams: true });

containersRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = getOpenAIClient();
    const params = toContainerListParams(req.query);
    const response = await client.containers.list(Object.keys(params).length ? params : undefined);

    res.json(response);
  } catch (error) {
    next(error);
  }
});

containersRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = getOpenAIClient();
    const { name, fileIds, expiresAfter } = req.body as Record<string, unknown>;

    if (typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'name is required' });
    }

    const createParams: ContainerCreateParams = { name: name.trim() };

    const normalizedFileIds = extractStringArray(fileIds);
    if (normalizedFileIds) {
      createParams.file_ids = normalizedFileIds;
    }

    if (expiresAfter && typeof expiresAfter === 'object') {
      const { anchor, minutes } = expiresAfter as { anchor?: unknown; minutes?: unknown };
      if (anchor === 'last_active_at' && typeof minutes === 'number' && minutes > 0) {
        createParams.expires_after = { anchor, minutes };
      }
    }

    const created = await client.containers.create(createParams);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

containersRouter.get('/:containerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = getOpenAIClient();
    const container = await client.containers.retrieve(req.params.containerId);
    res.json(container);
  } catch (error) {
    next(error);
  }
});

containersRouter.delete('/:containerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = getOpenAIClient();
    await client.containers.delete(req.params.containerId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

containersRouter.use('/:containerId/files', containerFilesRouter);

containerFilesRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = getOpenAIClient();
    const params = toContainerFileListParams(req.query);
    const response = await client.containers.files.list(req.params.containerId, Object.keys(params).length ? params : undefined);

    res.json(response);
  } catch (error) {
    next(error);
  }
});

containerFilesRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = getOpenAIClient();
    const { fileId, filename, content, mimeType } = req.body as Record<string, unknown>;
    const containerId = req.params.containerId;

    if (typeof fileId === 'string' && fileId.trim().length > 0) {
      const created = await client.containers.files.create(containerId, { file_id: fileId.trim() });
      return res.status(201).json(created);
    }

    if (typeof filename !== 'string' || filename.trim().length === 0) {
      return res.status(400).json({ error: 'filename is required when uploading new file content' });
    }

    if (typeof content !== 'string' || content.length === 0) {
      return res.status(400).json({ error: 'content (base64 encoded string) is required when uploading new file content' });
    }

    const buffer = Buffer.from(content, 'base64');
    const upload = await OpenAI.toFile(
      buffer,
      filename,
      typeof mimeType === 'string' && mimeType.length > 0 ? { type: mimeType } : undefined,
    );

    const created = await client.containers.files.create(containerId, { file: upload });
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

containerFilesRouter.get('/:fileId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = getOpenAIClient();
    const file = await client.containers.files.retrieve(
      req.params.containerId,
      req.params.fileId,
    );

    res.json(file);
  } catch (error) {
    next(error);
  }
});

containerFilesRouter.get('/:fileId/content', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = getOpenAIClient();
    const response = await client.containers.files.content.retrieve(
      req.params.containerId,
      req.params.fileId,
    );

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

containerFilesRouter.delete('/:fileId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = getOpenAIClient();
    await client.containers.files.delete(req.params.containerId, req.params.fileId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
