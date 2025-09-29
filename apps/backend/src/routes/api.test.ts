import type { Server } from 'http';
import type { AddressInfo } from 'net';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import OpenAI from 'openai';

import { createApp } from '../app.js';

const filesListMock = vi.fn();
const filesCreateMock = vi.fn();
const filesRetrieveMock = vi.fn();
const filesContentMock = vi.fn();
const filesDeleteMock = vi.fn();

const containerListMock = vi.fn();
const containerCreateMock = vi.fn();
const containerRetrieveMock = vi.fn();
const containerDeleteMock = vi.fn();

const containerFilesListMock = vi.fn();
const containerFilesCreateMock = vi.fn();
const containerFilesRetrieveMock = vi.fn();
const containerFilesContentRetrieveMock = vi.fn();
const containerFilesDeleteMock = vi.fn();

const responsesCreateMock = vi.fn();
const responsesRetrieveMock = vi.fn();
const responsesDeleteMock = vi.fn();
const responsesCancelMock = vi.fn();
const responseInputItemsListMock = vi.fn();

const mockClient = {
  files: {
    list: filesListMock,
    create: filesCreateMock,
    retrieve: filesRetrieveMock,
    content: filesContentMock,
    delete: filesDeleteMock,
  },
  containers: {
    list: containerListMock,
    create: containerCreateMock,
    retrieve: containerRetrieveMock,
    delete: containerDeleteMock,
    files: {
      list: containerFilesListMock,
      create: containerFilesCreateMock,
      retrieve: containerFilesRetrieveMock,
      content: {
        retrieve: containerFilesContentRetrieveMock,
      },
      delete: containerFilesDeleteMock,
    },
  },
  responses: {
    create: responsesCreateMock,
    retrieve: responsesRetrieveMock,
    delete: responsesDeleteMock,
    cancel: responsesCancelMock,
    inputItems: {
      list: responseInputItemsListMock,
    },
  },
};

vi.mock('../lib/openaiClient.js', () => ({
  getOpenAIClient: vi.fn(() => mockClient),
}));

describe('HTTP API endpoints', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(() => {
    process.env.OPENAI_API_KEY = 'test-api-key';
  });

  beforeEach(async () => {
    vi.clearAllMocks();

    filesListMock.mockResolvedValue({ data: [] });
    filesCreateMock.mockResolvedValue({ id: 'file_123' });
    filesRetrieveMock.mockResolvedValue({ id: 'file_123' });
    filesContentMock.mockResolvedValue({
      arrayBuffer: async () => Buffer.from('file-content'),
      headers: new Headers({ 'content-type': 'text/plain' }),
    });
    filesDeleteMock.mockResolvedValue({ id: 'file_123', deleted: true });

    containerListMock.mockResolvedValue({ data: [] });
    containerCreateMock.mockResolvedValue({ id: 'container_123' });
    containerRetrieveMock.mockResolvedValue({ id: 'container_123' });
    containerDeleteMock.mockResolvedValue(undefined);

    containerFilesListMock.mockResolvedValue({ data: [] });
    containerFilesCreateMock.mockResolvedValue({ id: 'container_file_123' });
    containerFilesRetrieveMock.mockResolvedValue({ id: 'container_file_123' });
    containerFilesContentRetrieveMock.mockResolvedValue({
      arrayBuffer: async () => Buffer.from('container-file'),
      headers: new Headers({ 'content-type': 'text/plain' }),
    });
    containerFilesDeleteMock.mockResolvedValue(undefined);

    responsesCreateMock.mockResolvedValue({ id: 'resp_123' });
    responsesRetrieveMock.mockResolvedValue({ id: 'resp_123' });
    responsesDeleteMock.mockResolvedValue(undefined);
    responsesCancelMock.mockResolvedValue({ id: 'resp_123', status: 'cancelled' });
    responseInputItemsListMock.mockResolvedValue({ data: [] });

    const app = createApp();

    await new Promise<void>((resolve, reject) => {
      server = app.listen(0, (error?: Error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });

    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Unable to determine server address for tests');
    }

    baseUrl = `http://127.0.0.1:${(address as AddressInfo).port}`;
  });

  afterEach(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error?: Error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  });

  afterAll(() => {
    delete process.env.OPENAI_API_KEY;
  });

  it('returns a welcome message at the root route', async () => {
    const response = await fetch(`${baseUrl}/`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      message: 'Welcome to the Legendary Dollop API',
    });
  });

  it('exposes the API index with the expected endpoints', async () => {
    const response = await fetch(`${baseUrl}/api`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      message: 'API root',
      endpoints: {
        health: '/api/health',
        files: '/api/files',
        containers: '/api/containers',
        responses: '/api/responses',
      },
    });
  });

  it('returns server health information', async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.status).toBe('ok');
    expect(typeof payload.uptimeMs).toBe('number');
    expect(typeof payload.timestamp).toBe('string');
  });

  it('lists files using sanitized query parameters', async () => {
    const response = await fetch(
      `${baseUrl}/api/files?order=asc&purpose=assistants&after=file_42&limit=5`,
    );

    expect(response.status).toBe(200);
    expect(filesListMock).toHaveBeenCalledWith({
      order: 'asc',
      purpose: 'assistants',
      after: 'file_42',
      limit: 5,
    });
  });

  it('creates a file upload from base64 content', async () => {
    const toFileSpy = vi.spyOn(OpenAI, 'toFile').mockResolvedValue('upload-token' as never);

    try {
      const response = await fetch(`${baseUrl}/api/files`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          filename: 'notes.txt',
          purpose: 'assistants',
          content: Buffer.from('hello world').toString('base64'),
          mimeType: 'text/plain',
        }),
      });

      expect(response.status).toBe(201);
      expect(filesCreateMock).toHaveBeenCalledWith({
        file: 'upload-token',
        purpose: 'assistants',
      });
    } finally {
      toFileSpy.mockRestore();
    }
  });

  it('rejects invalid file creation requests', async () => {
    const response = await fetch(`${baseUrl}/api/files`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ purpose: 'assistants', content: '' }),
    });

    expect(response.status).toBe(400);
    expect(filesCreateMock).not.toHaveBeenCalled();
  });

  it('retrieves a file by id', async () => {
    const response = await fetch(`${baseUrl}/api/files/file_123`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(filesRetrieveMock).toHaveBeenCalledWith('file_123');
    expect(payload).toEqual({ id: 'file_123' });
  });

  it('returns file content as a base64 encoded payload', async () => {
    const response = await fetch(`${baseUrl}/api/files/file_123/content`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(filesContentMock).toHaveBeenCalledWith('file_123');
    expect(payload).toEqual({
      id: 'file_123',
      contentType: 'text/plain',
      base64: Buffer.from('file-content').toString('base64'),
    });
  });

  it('deletes a file by id', async () => {
    const response = await fetch(`${baseUrl}/api/files/file_123`, { method: 'DELETE' });

    expect(response.status).toBe(200);
    expect(filesDeleteMock).toHaveBeenCalledWith('file_123');
  });

  it('lists containers with sanitized query params', async () => {
    const response = await fetch(`${baseUrl}/api/containers?order=desc&after=cont_1&limit=3`);

    expect(response.status).toBe(200);
    expect(containerListMock).toHaveBeenCalledWith({
      order: 'desc',
      after: 'cont_1',
      limit: 3,
    });
  });

  it('creates a new container', async () => {
    const response = await fetch(`${baseUrl}/api/containers`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'My Container',
        fileIds: ['file_1', 'file_2'],
        expiresAfter: { anchor: 'last_active_at', minutes: 10 },
      }),
    });

    expect(response.status).toBe(201);
    expect(containerCreateMock).toHaveBeenCalledWith({
      name: 'My Container',
      file_ids: ['file_1', 'file_2'],
      expires_after: { anchor: 'last_active_at', minutes: 10 },
    });
  });

  it('retrieves a container by id', async () => {
    const response = await fetch(`${baseUrl}/api/containers/container_123`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(containerRetrieveMock).toHaveBeenCalledWith('container_123');
    expect(payload).toEqual({ id: 'container_123' });
  });

  it('deletes a container by id', async () => {
    const response = await fetch(`${baseUrl}/api/containers/container_123`, { method: 'DELETE' });

    expect(response.status).toBe(204);
    expect(containerDeleteMock).toHaveBeenCalledWith('container_123');
  });

  it('lists files within a container', async () => {
    const response = await fetch(
      `${baseUrl}/api/containers/container_123/files?order=asc&after=file_1&limit=2`,
    );

    expect(response.status).toBe(200);
    expect(containerFilesListMock).toHaveBeenCalledWith('container_123', {
      order: 'asc',
      after: 'file_1',
      limit: 2,
    });
  });

  it('attaches an existing file to a container', async () => {
    const response = await fetch(`${baseUrl}/api/containers/container_123/files`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fileId: 'file_123' }),
    });

    expect(response.status).toBe(201);
    expect(containerFilesCreateMock).toHaveBeenCalledWith('container_123', { file_id: 'file_123' });
  });

  it('uploads new content to a container', async () => {
    const toFileSpy = vi.spyOn(OpenAI, 'toFile').mockResolvedValue('upload-token' as never);

    try {
      const response = await fetch(`${baseUrl}/api/containers/container_123/files`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          filename: 'data.txt',
          content: Buffer.from('container content').toString('base64'),
          mimeType: 'text/plain',
        }),
      });

      expect(response.status).toBe(201);
      expect(containerFilesCreateMock).toHaveBeenCalledWith('container_123', { file: 'upload-token' });
    } finally {
      toFileSpy.mockRestore();
    }
  });

  it('retrieves a container file by id', async () => {
    const response = await fetch(`${baseUrl}/api/containers/container_123/files/file_456`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(containerFilesRetrieveMock).toHaveBeenCalledWith('file_456', {
      container_id: 'container_123',
    });
    expect(payload).toEqual({ id: 'container_file_123' });
  });

  it('returns container file content as base64 payload', async () => {
    const response = await fetch(`${baseUrl}/api/containers/container_123/files/file_456/content`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(containerFilesContentRetrieveMock).toHaveBeenCalledWith('file_456', {
      container_id: 'container_123',
    });
    expect(payload).toEqual({
      id: 'file_456',
      contentType: 'text/plain',
      base64: Buffer.from('container-file').toString('base64'),
    });
  });

  it('removes a file from a container', async () => {
    const response = await fetch(`${baseUrl}/api/containers/container_123/files/file_456`, {
      method: 'DELETE',
    });

    expect(response.status).toBe(204);
    expect(containerFilesDeleteMock).toHaveBeenCalledWith('file_456', {
      container_id: 'container_123',
    });
  });

  it('creates a response request', async () => {
    const response = await fetch(`${baseUrl}/api/responses`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-test',
        input: 'Hello',
      }),
    });

    expect(response.status).toBe(201);
    expect(responsesCreateMock).toHaveBeenCalledWith({
      model: 'gpt-test',
      input: 'Hello',
      stream: false,
    });
  });

  it('rejects streaming response creation requests', async () => {
    const response = await fetch(`${baseUrl}/api/responses`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-test',
        input: 'Hello',
        stream: true,
      }),
    });

    expect(response.status).toBe(400);
    expect(responsesCreateMock).not.toHaveBeenCalled();
  });

  it('retrieves a response by id with sanitized params', async () => {
    const response = await fetch(
      `${baseUrl}/api/responses/resp_123?include=steps&include_obfuscation=true&starting_after=2`,
    );

    expect(response.status).toBe(200);
    expect(responsesRetrieveMock).toHaveBeenCalledWith('resp_123', {
      stream: false,
      include: ['steps'],
      include_obfuscation: true,
      starting_after: 2,
    });
  });

  it('deletes a response by id', async () => {
    const response = await fetch(`${baseUrl}/api/responses/resp_123`, {
      method: 'DELETE',
    });

    expect(response.status).toBe(204);
    expect(responsesDeleteMock).toHaveBeenCalledWith('resp_123');
  });

  it('cancels a response by id', async () => {
    const response = await fetch(`${baseUrl}/api/responses/resp_123/cancel`, {
      method: 'POST',
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(responsesCancelMock).toHaveBeenCalledWith('resp_123');
    expect(payload).toEqual({ id: 'resp_123', status: 'cancelled' });
  });

  it('lists response input items with sanitized params', async () => {
    const response = await fetch(
      `${baseUrl}/api/responses/resp_123/input-items?include=metadata&order=desc&after=item_1&limit=4`,
    );

    expect(response.status).toBe(200);
    expect(responseInputItemsListMock).toHaveBeenCalledWith('resp_123', {
      include: ['metadata'],
      order: 'desc',
      after: 'item_1',
      limit: 4,
    });
  });
});
