import { Router } from 'express';
import type { Request, Response } from 'express';
import {
  testConnection,
  scanKeys,
  getStringValue,
  getListValue,
  getHashValue,
  getSetValue,
  getZSetValue,
  getStreamValue,
  mapRedisError,
} from '../services/redis.service.js';
import type {
  TestConnectionRequest,
  KeysRequest,
  KeyValueRequest,
  ListValueRequest,
  HashValueRequest,
  SetValueRequest,
  ZSetValueRequest,
  StreamValueRequest,
  ApiResponse,
} from '../types/index.js';

export const redisRoutes = Router();

/**
 * POST /api/redis/test
 * Tests connection to a Redis instance
 */
redisRoutes.post('/test', async (req: Request<object, object, TestConnectionRequest>, res: Response) => {
  const { host, port, password, database, tls } = req.body;

  // Validation
  if (!host || !port) {
    const response: ApiResponse = {
      success: false,
      error: 'Host y puerto son requeridos',
      code: 'VALIDATION_ERROR',
    };
    res.status(400).json(response);
    return;
  }

  try {
    const result = await testConnection({
      name: 'test',
      host,
      port,
      password,
      database,
      tls,
    });

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
    };
    res.json(response);
  } catch (err) {
    const { code, message } = mapRedisError(err as Error);
    const response: ApiResponse = {
      success: false,
      error: message,
      code,
    };
    res.status(502).json(response);
  }
});

/**
 * POST /api/redis/keys
 * Lists keys matching a pattern
 */
redisRoutes.post('/keys', async (req: Request<object, object, KeysRequest>, res: Response) => {
  const { connection, pattern = '*', cursor = '0', count = 100 } = req.body;

  if (!connection?.host || !connection?.port) {
    const response: ApiResponse = {
      success: false,
      error: 'Configuración de conexión inválida',
      code: 'VALIDATION_ERROR',
    };
    res.status(400).json(response);
    return;
  }

  try {
    const result = await scanKeys(connection, pattern, cursor, count);
    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
    };
    res.json(response);
  } catch (err) {
    const { code, message } = mapRedisError(err as Error);
    const response: ApiResponse = {
      success: false,
      error: message,
      code,
    };
    res.status(502).json(response);
  }
});

/**
 * POST /api/redis/key/string
 * Gets the value of a string key
 */
redisRoutes.post('/key/string', async (req: Request<object, object, KeyValueRequest>, res: Response) => {
  const { connection, key } = req.body;

  if (!connection?.host || !key) {
    const response: ApiResponse = {
      success: false,
      error: 'Conexión y key son requeridos',
      code: 'VALIDATION_ERROR',
    };
    res.status(400).json(response);
    return;
  }

  try {
    const result = await getStringValue(connection, key);
    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
    };
    res.json(response);
  } catch (err) {
    const { code, message } = mapRedisError(err as Error);
    const response: ApiResponse = {
      success: false,
      error: message,
      code,
    };
    res.status(502).json(response);
  }
});

/**
 * POST /api/redis/key/list
 * Gets elements from a list
 */
redisRoutes.post('/key/list', async (req: Request<object, object, ListValueRequest>, res: Response) => {
  const { connection, key, start = 0, stop = 49 } = req.body;

  if (!connection?.host || !key) {
    const response: ApiResponse = {
      success: false,
      error: 'Conexión y key son requeridos',
      code: 'VALIDATION_ERROR',
    };
    res.status(400).json(response);
    return;
  }

  try {
    const result = await getListValue(connection, key, start, stop);
    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
    };
    res.json(response);
  } catch (err) {
    const { code, message } = mapRedisError(err as Error);
    const response: ApiResponse = {
      success: false,
      error: message,
      code,
    };
    res.status(502).json(response);
  }
});

/**
 * POST /api/redis/key/hash
 * Gets fields from a hash
 */
redisRoutes.post('/key/hash', async (req: Request<object, object, HashValueRequest>, res: Response) => {
  const { connection, key, cursor = '0', count = 50 } = req.body;

  if (!connection?.host || !key) {
    const response: ApiResponse = {
      success: false,
      error: 'Conexión y key son requeridos',
      code: 'VALIDATION_ERROR',
    };
    res.status(400).json(response);
    return;
  }

  try {
    const result = await getHashValue(connection, key, cursor, count);
    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
    };
    res.json(response);
  } catch (err) {
    const { code, message } = mapRedisError(err as Error);
    const response: ApiResponse = {
      success: false,
      error: message,
      code,
    };
    res.status(502).json(response);
  }
});

/**
 * POST /api/redis/key/set
 * Gets members from a set
 */
redisRoutes.post('/key/set', async (req: Request<object, object, SetValueRequest>, res: Response) => {
  const { connection, key, cursor = '0', count = 50 } = req.body;

  if (!connection?.host || !key) {
    const response: ApiResponse = {
      success: false,
      error: 'Conexión y key son requeridos',
      code: 'VALIDATION_ERROR',
    };
    res.status(400).json(response);
    return;
  }

  try {
    const result = await getSetValue(connection, key, cursor, count);
    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
    };
    res.json(response);
  } catch (err) {
    const { code, message } = mapRedisError(err as Error);
    const response: ApiResponse = {
      success: false,
      error: message,
      code,
    };
    res.status(502).json(response);
  }
});

/**
 * POST /api/redis/key/zset
 * Gets members from a sorted set
 */
redisRoutes.post('/key/zset', async (req: Request<object, object, ZSetValueRequest>, res: Response) => {
  const { connection, key, start = 0, stop = 49, order = 'desc' } = req.body;

  if (!connection?.host || !key) {
    const response: ApiResponse = {
      success: false,
      error: 'Conexión y key son requeridos',
      code: 'VALIDATION_ERROR',
    };
    res.status(400).json(response);
    return;
  }

  try {
    const result = await getZSetValue(connection, key, start, stop, order);
    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
    };
    res.json(response);
  } catch (err) {
    const { code, message } = mapRedisError(err as Error);
    const response: ApiResponse = {
      success: false,
      error: message,
      code,
    };
    res.status(502).json(response);
  }
});

/**
 * POST /api/redis/key/stream
 * Gets messages from a stream
 */
redisRoutes.post('/key/stream', async (req: Request<object, object, StreamValueRequest>, res: Response) => {
  const { connection, key, start = '-', end = '+', count = 50 } = req.body;

  if (!connection?.host || !key) {
    const response: ApiResponse = {
      success: false,
      error: 'Conexión y key son requeridos',
      code: 'VALIDATION_ERROR',
    };
    res.status(400).json(response);
    return;
  }

  try {
    const result = await getStreamValue(connection, key, start, end, count);
    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
    };
    res.json(response);
  } catch (err) {
    const { code, message } = mapRedisError(err as Error);
    const response: ApiResponse = {
      success: false,
      error: message,
      code,
    };
    res.status(502).json(response);
  }
});

