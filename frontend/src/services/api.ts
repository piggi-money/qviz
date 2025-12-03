import type {
  ConnectionConfig,
  ApiResponse,
  TestConnectionResult,
  KeysListResult,
  StringValueResult,
  ListValueResult,
  HashValueResult,
  SetValueResult,
  ZSetValueResult,
  StreamValueResult,
  RedisKeyType,
} from '../types';

const API_BASE = '/api/redis';

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();
    return data as ApiResponse<T>;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión',
      code: 'NETWORK_ERROR',
    };
  }
}

/**
 * Test connection to a Redis instance
 */
export async function testConnection(
  config: Omit<ConnectionConfig, 'id' | 'name'>
): Promise<ApiResponse<TestConnectionResult>> {
  return fetchApi<TestConnectionResult>('/test', {
    method: 'POST',
    body: JSON.stringify(config),
  });
}

/**
 * Fetch keys from a Redis instance
 */
export async function fetchKeys(
  connection: ConnectionConfig,
  pattern = '*',
  cursor = '0',
  count = 100
): Promise<ApiResponse<KeysListResult>> {
  return fetchApi<KeysListResult>('/keys', {
    method: 'POST',
    body: JSON.stringify({ connection, pattern, cursor, count }),
  });
}

/**
 * Fetch all keys (handles pagination automatically)
 */
export async function fetchAllKeys(
  connection: ConnectionConfig,
  pattern = '*',
  maxKeys = 1000
): Promise<ApiResponse<KeysListResult>> {
  const allKeys: KeysListResult['keys'] = [];
  let cursor = '0';
  let hasMore = true;

  while (hasMore && allKeys.length < maxKeys) {
    const result = await fetchKeys(connection, pattern, cursor, 100);
    
    if (!result.success || !result.data) {
      return result;
    }

    allKeys.push(...result.data.keys);
    cursor = result.data.cursor;
    hasMore = result.data.hasMore;
  }

  return {
    success: true,
    data: {
      cursor,
      keys: allKeys,
      hasMore,
    },
  };
}

/**
 * Fetch content of a key based on its type
 */
export async function fetchKeyContent(
  connection: ConnectionConfig,
  key: string,
  type: RedisKeyType
): Promise<ApiResponse<StringValueResult | ListValueResult | HashValueResult | SetValueResult | ZSetValueResult | StreamValueResult>> {
  const endpoint = `/key/${type}`;
  
  return fetchApi(endpoint, {
    method: 'POST',
    body: JSON.stringify({ connection, key }),
  });
}

/**
 * Fetch string value
 */
export async function fetchStringValue(
  connection: ConnectionConfig,
  key: string
): Promise<ApiResponse<StringValueResult>> {
  return fetchApi<StringValueResult>('/key/string', {
    method: 'POST',
    body: JSON.stringify({ connection, key }),
  });
}

/**
 * Fetch list value with pagination
 */
export async function fetchListValue(
  connection: ConnectionConfig,
  key: string,
  start = 0,
  stop = 49
): Promise<ApiResponse<ListValueResult>> {
  return fetchApi<ListValueResult>('/key/list', {
    method: 'POST',
    body: JSON.stringify({ connection, key, start, stop }),
  });
}

/**
 * Fetch hash value with pagination
 */
export async function fetchHashValue(
  connection: ConnectionConfig,
  key: string,
  cursor = '0',
  count = 50
): Promise<ApiResponse<HashValueResult>> {
  return fetchApi<HashValueResult>('/key/hash', {
    method: 'POST',
    body: JSON.stringify({ connection, key, cursor, count }),
  });
}

/**
 * Fetch set value with pagination
 */
export async function fetchSetValue(
  connection: ConnectionConfig,
  key: string,
  cursor = '0',
  count = 50
): Promise<ApiResponse<SetValueResult>> {
  return fetchApi<SetValueResult>('/key/set', {
    method: 'POST',
    body: JSON.stringify({ connection, key, cursor, count }),
  });
}

/**
 * Fetch sorted set value with pagination
 */
export async function fetchZSetValue(
  connection: ConnectionConfig,
  key: string,
  start = 0,
  stop = 49,
  order: 'asc' | 'desc' = 'desc'
): Promise<ApiResponse<ZSetValueResult>> {
  return fetchApi<ZSetValueResult>('/key/zset', {
    method: 'POST',
    body: JSON.stringify({ connection, key, start, stop, order }),
  });
}

/**
 * Fetch stream value with pagination
 */
export async function fetchStreamValue(
  connection: ConnectionConfig,
  key: string,
  start = '-',
  end = '+',
  count = 50
): Promise<ApiResponse<StreamValueResult>> {
  return fetchApi<StreamValueResult>('/key/stream', {
    method: 'POST',
    body: JSON.stringify({ connection, key, start, end, count }),
  });
}

